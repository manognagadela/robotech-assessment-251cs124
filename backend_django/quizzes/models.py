from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class Quiz(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True, default="You are about to enter a proctored assessment environment. Please ensure your surroundings are compliant with standard evaluation protocols.")
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_quizzes')
    
    join_code = models.CharField(max_length=20, unique=True, help_text="Code required to enter the quiz")
    duration_minutes = models.IntegerField(default=30)
    
    is_active = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    
    # Proctoring Settings
    auto_submit_on_tab_switch = models.BooleanField(default=True)
    require_fullscreen = models.BooleanField(default=True)
    disable_right_click = models.BooleanField(default=True)
    
    # Marking Defaults
    default_marks = models.FloatField(default=4.0)
    default_negative_marks = models.FloatField(default=1.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice Single Answer'),
        ('MSQ', 'Multiple Select Questions'),
        ('SHORT', 'Short Answer'),
        ('LONG', 'Long Answer'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='MCQ')
    
    marks = models.FloatField()
    negative_marks = models.FloatField(default=0)
    
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}"

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']

class QuizAttempt(models.Model):
    STATUS_CHOICES = [
        ('STARTING', 'Questionnaire Phase'),
        ('ONGOING', 'Quiz in Progress'),
        ('SUBMITTED', 'Manually Submitted'),
        ('AUTO_SUBMITTED', 'Auto Submitted (Timer)'),
        ('DISQUALIFIED', 'Disqualified (Proctoring Violation)'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='quiz_attempts')
    
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True) # Expected end time
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='STARTING')
    
    # Identification for Guests
    candidate_name = models.CharField(max_length=200, blank=True)
    candidate_email = models.EmailField(blank=True)
    
    # Store initial questionnaire data if needed
    questionnaire_data = models.JSONField(default=dict, blank=True)
    
    # Store responses: { question_id: [option_ids] }
    responses = models.JSONField(default=dict, blank=True)
    
    score = models.FloatField(default=0.0)
    
    class Meta:
        pass
        # unique_together removed to support guests

    @property
    def time_left_seconds(self):
        if self.status != 'ONGOING' or not self.end_time:
            return 0
        now = timezone.now()
        remaining = (self.end_time - now).total_seconds()
        return max(0, int(remaining))
