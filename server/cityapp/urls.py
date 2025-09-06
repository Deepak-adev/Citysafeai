from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/crime-predictions/', views.get_crime_predictions, name='crime_predictions'),
]