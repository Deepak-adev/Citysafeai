from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/crime-predictions/', views.get_crime_predictions, name='crime_predictions'),
    path('api/register/', views.register_user, name='register_user'),
    path('api/login/', views.login_user, name='login_user'),
    path('api/send-alert/', views.send_alert, name='send_alert'),
    path('api/validate-police-id/', views.validate_police_id, name='validate_police_id'),
]