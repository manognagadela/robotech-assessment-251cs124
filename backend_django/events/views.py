from rest_framework import viewsets, permissions
from .models import Event
from .serializers import EventSerializer
from users.permissions import GlobalPermission

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        # Shared visibility for authenticated users
        if self.request.user and self.request.user.is_authenticated:
            return Event.objects.all().order_by('-date')
        return Event.objects.none()

    def perform_create(self, serializer):
        serializer.save()
