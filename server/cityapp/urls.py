from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/crime-predictions/', views.get_crime_predictions, name='crime_predictions'),
    path('api/register/', views.register_user, name='register_user'),
    path('api/login/', views.login_user, name='login_user'),
    path('api/send-alert/', views.send_alert, name='send_alert'),
    path('api/validate-police-id/', views.validate_police_id, name='validate_police_id'),
    path('api/send-sos/', views.send_sos_alert, name='send_sos_alert'),
    path('api/check-hotspot/', views.check_hotspot_status, name='check_hotspot_status'),
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    
    # New user management endpoints
    path('api/user-profile/', views.user_profile, name='user_profile'),
    path('api/emergency-contacts/', views.emergency_contacts, name='emergency_contacts'),
    path('api/update-location/', views.update_location, name='update_location'),
    path('api/user-activities/', views.user_activities, name='user_activities'),
=======
    path('api/route-coordinates/', views.get_route_coordinates, name='get_route_coordinates'),
    path('api/patrol-route-coordinates/', views.get_patrol_route_coordinates, name='get_patrol_route_coordinates'),
>>>>>>> Stashed changes
=======
    path('api/route-coordinates/', views.get_route_coordinates, name='get_route_coordinates'),
    path('api/patrol-route-coordinates/', views.get_patrol_route_coordinates, name='get_patrol_route_coordinates'),
>>>>>>> Stashed changes
    path('api/register/', views.register_user, name='register_user'),
    path('api/login/', views.login_user, name='login_user'),
    path('api/send-alert/', views.send_alert, name='send_alert'),
    path('api/validate-police-id/', views.validate_police_id, name='validate_police_id'),
    path('api/send-sos/', views.send_sos_alert, name='send_sos_alert'),
    path('api/check-hotspot/', views.check_hotspot_status, name='check_hotspot_status'),
    
    # New user management endpoints
    path('api/user-profile/', views.user_profile, name='user_profile'),
    path('api/emergency-contacts/', views.emergency_contacts, name='emergency_contacts'),
    path('api/update-location/', views.update_location, name='update_location'),
    path('api/user-activities/', views.user_activities, name='user_activities'),
]