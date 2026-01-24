from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, Task, TaskComment, ProjectRequest, ProjectThread, ThreadMessage
from .serializers import (
    ProjectSerializer, TaskSerializer, TaskCommentSerializer,
    ProjectRequestSerializer, ProjectThreadSerializer, ThreadMessageSerializer
)
from users.permissions import GlobalPermission

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        # Simple Shared Visibility: All authenticated see all
        if self.request.user and self.request.user.is_authenticated:
            return Project.objects.all().order_by('-created_at')
        return Project.objects.none()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def request_status(self, request, pk=None):
        project = self.get_object()
        project.status_update_requested = True
        project.status_requested_by = request.user
        project.save()
        return Response({'status': 'Status update requested'})

    @action(detail=True, methods=['post'])
    def submit_status(self, request, pk=None):
        project = self.get_object()
        update_text = request.data.get('update_text')
        if update_text:
            project.last_status_update = update_text
            project.status_update_requested = False
            project.save()
            return Response({'status': 'Status updated'})
        return Response({'error': 'No text provided'}, status=400)

    @action(detail=True, methods=['post'])
    def request_join(self, request, pk=None):
        project = self.get_object()
        user = request.user
        message = request.data.get('message', '')
        
        if project.members.filter(id=user.id).exists():
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
            
        obj, created = ProjectRequest.objects.get_or_create(
            project=project, user=user,
            defaults={'message': message}
        )
        if not created:
            return Response({'error': 'Request already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'status': 'Join request sent'})

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return Task.objects.all()
        return Task.objects.none()

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        task = self.get_object()
        content = request.data.get('content')
        if not content: return Response({'error': 'Content required'}, status=400)
        
        TaskComment.objects.create(task=task, author=request.user, content=content)
        return Response({'status': 'Comment added'})

class ProjectRequestViewSet(viewsets.ModelViewSet):
    queryset = ProjectRequest.objects.all()
    serializer_class = ProjectRequestSerializer
    permission_classes = [GlobalPermission]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        join_req = self.get_object()
        # Verify if requester is lead or admin
        user = request.user
        if not (user.is_superuser or join_req.project.lead == user or user.user_roles.filter(can_manage_projects=True).exists()):
             return Response({"error": "Unauthorized"}, status=403)
             
        join_req.status = 'APPROVED'
        join_req.save()
        join_req.project.members.add(join_req.user)
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        join_req = self.get_object()
        user = request.user
        if not (user.is_superuser or join_req.project.lead == user or user.user_roles.filter(can_manage_projects=True).exists()):
             return Response({"error": "Unauthorized"}, status=403)
        join_req.status = 'REJECTED'
        join_req.save()
        return Response({"status": "rejected"})

class ProjectThreadViewSet(viewsets.ModelViewSet):
    queryset = ProjectThread.objects.all()
    serializer_class = ProjectThreadSerializer
    permission_classes = [GlobalPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ThreadMessageViewSet(viewsets.ModelViewSet):
    queryset = ThreadMessage.objects.all()
    serializer_class = ThreadMessageSerializer
    permission_classes = [GlobalPermission]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
