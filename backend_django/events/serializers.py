from rest_framework import serializers
from .models import Event
from users.serializers import UserSerializer

class EventSerializer(serializers.ModelSerializer):
    lead_details = UserSerializer(source='lead', read_only=True)
    volunteers_details = UserSerializer(source='volunteers', many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
