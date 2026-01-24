from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, ProjectRequestViewSet, ProjectThreadViewSet, ThreadMessageViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='projects')
router.register(r'tasks', TaskViewSet, basename='tasks')
router.register(r'join-requests', ProjectRequestViewSet, basename='join-requests')
router.register(r'threads', ProjectThreadViewSet, basename='threads')
router.register(r'messages', ThreadMessageViewSet, basename='messages')

urlpatterns = [
    path('', include(router.urls)),
]
