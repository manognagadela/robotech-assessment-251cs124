from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Quiz, Question, Option, QuizAttempt
from .serializers import QuizSerializer, QuestionSerializer, OptionSerializer, QuizAttemptSerializer, PublicQuizSerializer
from users.permissions import GlobalPermission

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all().order_by('-created_at')
    serializer_class = QuizSerializer
    permission_classes = [GlobalPermission]

    def get_serializer_class(self):
        # Admin/Manager gets full access (with answers)
        if self.request.user.is_superuser:
            return QuizSerializer
            
        # Check permissions via GlobalFlag or Role
        # Ideally check 'can_manage_forms' etc. For now, assume if they have write access via perm check they are admin.
        # But simpler: If action is list/retrieve for PUBLIC access, use Safe Serializer.
        # If user has role with 'can_manage_forms', use Full.
        
        has_manage_perm = False
        if self.request.user.is_authenticated:
            if self.request.user.user_roles.filter(can_manage_forms=True).exists(): has_manage_perm = True
        
        if not has_manage_perm:
            return PublicQuizSerializer
            
        return QuizSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=['post', 'get'], permission_classes=[permissions.AllowAny])
    def join_by_code(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"error": "Join code required"}, status=400)
            
        quiz = Quiz.objects.filter(join_code=code, is_active=True).first()
        if not quiz:
            return Response({"error": "Invalid code or quiz inactive"}, status=404)
            
        user = request.user if request.user.is_authenticated else None
        email = request.data.get('email', '').lower() if not user else ''
        
        attempt = None
        if user:
            attempt = QuizAttempt.objects.filter(quiz=quiz, user=user).first()
        elif email:
            attempt = QuizAttempt.objects.filter(quiz=quiz, candidate_email=email).first()

        # If it's a POST and we have identity, try to create attempt
        if not attempt and request.method == 'POST' and (user or email):
            name = request.data.get('name', 'Anonymous Candidate')
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                user=user,
                candidate_name=name if not user else (user.profile.full_name if hasattr(user, 'profile') else user.username),
                candidate_email=email if not user else user.email
            )
        
        # If no attempt exists (Step 1: Code Verification), return success status
        if not attempt:
             return Response({
                 "status": "code_valid", 
                 "quiz_title": quiz.title,
                 "requires_identity": not user
             })

        return Response({
            "quiz": PublicQuizSerializer(quiz).data,
            "attempt": QuizAttemptSerializer(attempt).data
        })

    def _get_attempt(self, request, quiz):
        user = request.user if request.user.is_authenticated else None
        if user:
            return QuizAttempt.objects.filter(quiz=quiz, user=user).first()
        email = request.data.get('email')
        if email:
            return QuizAttempt.objects.filter(quiz=quiz, candidate_email=email.lower()).first()
        return None

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def start_quiz(self, request, pk=None):
        quiz = self.get_object()
        attempt = self._get_attempt(request, quiz)
        
        if not attempt:
            return Response({"error": "Join the quiz first"}, status=400)
            
        if attempt.status != 'STARTING':
            return Response({"error": "Quiz already started or submitted"}, status=400)
            
        q_data = request.data.get('questionnaire_data', {})
        attempt.questionnaire_data = q_data
        
        attempt.status = 'ONGOING'
        attempt.start_time = timezone.now()
        attempt.end_time = attempt.start_time + timedelta(minutes=quiz.duration_minutes)
        attempt.save()
        
        return Response(QuizAttemptSerializer(attempt).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def submit_quiz(self, request, pk=None):
        quiz = self.get_object()
        attempt = self._get_attempt(request, quiz)
        
        if not attempt or attempt.status not in ['ONGOING', 'STARTING']:
             return Response({"error": "No active session"}, status=400)
             
        is_disqualified = request.data.get('disqualified', False)
        self._calculate_and_save(attempt, quiz, is_disqualified)
        return Response(QuizAttemptSerializer(attempt).data)

    def _calculate_and_save(self, attempt, quiz, is_disqualified=False):
        if is_disqualified:
            attempt.status = 'DISQUALIFIED'
            attempt.score = 0
        else:
            total_score = 0
            questions = quiz.questions.prefetch_related('options').all()
            
            for q in questions:
                user_ans = attempt.responses.get(str(q.id), [])
                if q.question_type in ['MCQ', 'MSQ']:
                    correct_ans = list(q.options.filter(is_correct=True).values_list('id', flat=True))
                    if not user_ans: continue
                    if set(map(int, user_ans)) == set(correct_ans):
                        total_score += q.marks
                    else:
                        total_score -= q.negative_marks
                else:
                    # Manual grading or neutral for now for short/long
                    pass
            
            attempt.score = total_score
            attempt.status = 'SUBMITTED'
            
        attempt.submitted_at = timezone.now()
        attempt.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def update_responses(self, request, pk=None):
        quiz = self.get_object()
        attempt = self._get_attempt(request, quiz)
        
        if not attempt or attempt.status != 'ONGOING':
            return Response({"error": "Quiz session not ongoing"}, status=400)
            
        if attempt.time_left_seconds <= 0:
            self._calculate_and_save(attempt, quiz)
            return Response({"error": "Time exceeded. Quiz auto-submitted."}, status=400)
            
        responses = request.data.get('responses')
        if responses is not None:
            attempt.responses = responses
            attempt.save()
            
        return Response({"status": "saved", "time_left": attempt.time_left_seconds})

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [GlobalPermission]

class OptionViewSet(viewsets.ModelViewSet):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [GlobalPermission]

class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [GlobalPermission]
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return QuizAttempt.objects.all()
        return QuizAttempt.objects.filter(user=self.request.user)
