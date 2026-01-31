from rest_framework import serializers
from .models import Quiz, Question, Option, QuizAttempt
from users.serializers import UserSerializer

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'question', 'text', 'is_correct', 'order']

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'question_type', 'marks', 'negative_marks', 'order', 'options']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    creator_details = UserSerializer(source='creator', read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    
    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ['creator', 'created_at']

class QuizAttemptSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    time_left = serializers.IntegerField(source='time_left_seconds', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ['user', 'score', 'submitted_at', 'candidate_name', 'candidate_email']

# Public/Safe Serializers (No Answers)
class PublicOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'question', 'text', 'order'] # Exclude is_correct

class PublicQuestionSerializer(serializers.ModelSerializer):
    options = PublicOptionSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'question_type', 'marks', 'negative_marks', 'order', 'options']

class PublicQuizSerializer(serializers.ModelSerializer):
    questions = PublicQuestionSerializer(many=True, read_only=True)
    creator_details = UserSerializer(source='creator', read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    
    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ['creator', 'created_at']
