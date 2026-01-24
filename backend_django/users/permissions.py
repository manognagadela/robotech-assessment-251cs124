from rest_framework import permissions

class GlobalPermission(permissions.BasePermission):
    """
    Role-Based Access Control via Structure Positions & Roles:
    - READ: Shared Visibility for all authenticated team members.
    - WRITE: Based on permission flags in the user's assigned Roles 
      OR the Role linked to their 'Structure Position'.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        # 1. Superuser/Admin Bypass
        if user.is_superuser:
            return True

        # 2. Get all relevant Role flags for the user
        def get_user_flags():
            # I'll check flags in the view logic for performance/simplicity
            # but here I define what they are.
            pass

        # Helper: check for specific flag across all sources
        def check_flag(flag_name):
            # A. Check explicitly assigned roles
            if user.user_roles.filter(**{flag_name: True}).exists():
                return True
            
            # B. Check Role linked to user's Position (Structure Management)
            try:
                from .models import TeamPosition
                pos_name = getattr(user.profile, 'position', None)
                if pos_name:
                    pos = TeamPosition.objects.filter(name__iexact=pos_name).first()
                    if pos and pos.role_link and getattr(pos.role_link, flag_name):
                        return True
            except: pass
            
            return False

        # 3. Web Lead / Security Manager check (Full Access)
        if check_flag('can_manage_security'):
            return True

        # 4. Shared Visibility: All authenticated users can view all data
        if request.method in permissions.SAFE_METHODS:
            return True

        # 5. Mutation Mapping
        view_name = view.__class__.__name__
        perm_map = {
            'UserViewSet': 'can_manage_users',
            'RoleViewSet': 'can_manage_users',
            'SigViewSet': 'can_manage_users',
            'TeamPositionViewSet': 'can_manage_users',
            'ProfileFieldViewSet': 'can_manage_users',
            'ProjectViewSet': 'can_manage_projects',
            'TaskViewSet': 'can_manage_projects',
            'EventViewSet': 'can_manage_events',
            'AnnouncementViewSet': 'can_manage_announcements',
            'GalleryViewSet': 'can_manage_gallery',
            'SponsorshipViewSet': 'can_manage_announcements',
            'ContactMessageViewSet': 'can_manage_announcements',
            'AuditLogViewSet': 'can_manage_security',
        }

        flag = perm_map.get(view_name)
        if not flag:
            return False # Strictly deny unmapped write actions
            
        return check_flag(flag)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class IsWebLead(permissions.BasePermission):
    """Fallback/Specific check for highest level"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated: return False
        if request.user.is_superuser: return True
        return request.user.user_roles.filter(can_manage_security=True).exists()
