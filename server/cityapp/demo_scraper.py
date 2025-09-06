import json
from datetime import datetime, timedelta
import random

class DemoCrimeForecastScraper:
    def __init__(self):
        # Sample crime-related articles for demonstration
        self.demo_articles = [
            {
                'title': 'Tamil Nadu Assembly Passes New Anti-Riot Bill',
                'link': 'https://example.com/anti-riot-bill',
                'source': 'The Hindu',
                'content': 'The Tamil Nadu Assembly has passed a new anti-riot bill that increases penalties for violent protests and riots. The bill includes provisions for preventive detention and enhanced police powers.',
                'keywords': [('riot', 'high_risk', 2), ('bill', 'legal_risk', 1), ('protest', 'medium_risk', 1)],
                'severity': 'high',
                'scraped_at': (datetime.now() - timedelta(hours=2)).isoformat()
            },
            {
                'title': 'Communal Tension Rises in Chennai After Temple Dispute',
                'link': 'https://example.com/temple-dispute',
                'source': 'Times of India',
                'content': 'Tensions are rising in Chennai after a dispute over temple management led to clashes between different communities. Police have increased patrols in the area.',
                'keywords': [('communal', 'high_risk', 1), ('tension', 'medium_risk', 1), ('clash', 'high_risk', 1), ('dispute', 'medium_risk', 1)],
                'severity': 'high',
                'scraped_at': (datetime.now() - timedelta(hours=4)).isoformat()
            },
            {
                'title': 'Student Protests Continue Over Fee Hike',
                'link': 'https://example.com/student-protests',
                'source': 'Deccan Chronicle',
                'content': 'Students across Tamil Nadu continue to protest against the recent fee hike in educational institutions. The protests have been largely peaceful so far.',
                'keywords': [('protest', 'medium_risk', 2), ('student', 'social_risk', 1), ('fee', 'social_risk', 1)],
                'severity': 'medium',
                'scraped_at': (datetime.now() - timedelta(hours=6)).isoformat()
            },
            {
                'title': 'New Cyber Crime Laws Come Into Effect',
                'link': 'https://example.com/cyber-crime-laws',
                'source': 'The Hindu',
                'content': 'New cyber crime laws have come into effect in Tamil Nadu, providing enhanced penalties for online fraud and cyber attacks. The laws also include provisions for data protection.',
                'keywords': [('cyber', 'legal_risk', 1), ('crime', 'high_risk', 1), ('law', 'legal_risk', 1), ('fraud', 'high_risk', 1)],
                'severity': 'medium',
                'scraped_at': (datetime.now() - timedelta(hours=8)).isoformat()
            },
            {
                'title': 'Water Dispute Leads to Road Blockade',
                'link': 'https://example.com/water-dispute',
                'source': 'Times of India',
                'content': 'A water dispute between two villages has led to a road blockade on the Chennai-Bangalore highway. Traffic has been diverted as negotiations continue.',
                'keywords': [('dispute', 'medium_risk', 1), ('water', 'social_risk', 1), ('blockade', 'medium_risk', 1), ('traffic', 'social_risk', 1)],
                'severity': 'medium',
                'scraped_at': (datetime.now() - timedelta(hours=10)).isoformat()
            },
            {
                'title': 'Economic Crisis Affects Small Businesses',
                'link': 'https://example.com/economic-crisis',
                'source': 'Deccan Chronicle',
                'content': 'The ongoing economic crisis has severely affected small businesses in Chennai. Many shop owners are struggling to pay rent and salaries.',
                'keywords': [('crisis', 'social_risk', 1), ('economic', 'social_risk', 1), ('business', 'social_risk', 1)],
                'severity': 'low',
                'scraped_at': (datetime.now() - timedelta(hours=12)).isoformat()
            }
        ]

    def run_forecast_analysis(self):
        """Run demo crime forecast analysis with sample data"""
        print("Running demo crime forecast analysis...")
        
        # Simulate some processing time
        import time
        time.sleep(2)
        
        # Generate alerts based on demo articles
        alerts = self._generate_demo_alerts()
        
        # Create summary
        summary = {
            'total_articles_analyzed': len(self.demo_articles),
            'high_risk_articles': len([a for a in self.demo_articles if a['severity'] == 'high']),
            'medium_risk_articles': len([a for a in self.demo_articles if a['severity'] == 'medium']),
            'low_risk_articles': len([a for a in self.demo_articles if a['severity'] == 'low']),
            'total_alerts_generated': len(alerts),
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        return {
            'summary': summary,
            'articles': self.demo_articles,
            'alerts': alerts
        }

    def _generate_demo_alerts(self):
        """Generate demo alerts based on article patterns"""
        alerts = []
        
        # High risk alert for riots
        riot_articles = [a for a in self.demo_articles if any('riot' in kw[0] for kw in a['keywords'])]
        if riot_articles:
            alerts.append({
                'type': 'RIOT_ALERT',
                'title': 'Riot-Related Activity Detected',
                'message': f'Found {len(riot_articles)} articles mentioning riot-related activities. Immediate attention required.',
                'severity': 'high',
                'articles': riot_articles[:2],
                'recommendations': [
                    'Deploy riot control units',
                    'Monitor social media for mobilization',
                    'Coordinate with local authorities'
                ],
                'generated_at': datetime.now().isoformat()
            })
        
        # High risk alert for communal tension
        communal_articles = [a for a in self.demo_articles if any('communal' in kw[0] for kw in a['keywords'])]
        if communal_articles:
            alerts.append({
                'type': 'COMMUNAL_TENSION_ALERT',
                'title': 'Communal Tension Indicators Detected',
                'message': f'Found {len(communal_articles)} articles indicating communal tension. Monitor affected areas closely.',
                'severity': 'high',
                'articles': communal_articles[:2],
                'recommendations': [
                    'Increase police presence in sensitive areas',
                    'Engage with community leaders',
                    'Prepare for potential escalation'
                ],
                'generated_at': datetime.now().isoformat()
            })
        
        # Medium risk alert for protests
        protest_articles = [a for a in self.demo_articles if any('protest' in kw[0] for kw in a['keywords'])]
        if len(protest_articles) >= 2:
            alerts.append({
                'type': 'PROTEST_ALERT',
                'title': 'Multiple Protest Activities Detected',
                'message': f'Detected {len(protest_articles)} articles about protest activities. Monitor for potential escalation.',
                'severity': 'medium',
                'articles': protest_articles[:2],
                'recommendations': [
                    'Monitor protest locations',
                    'Prepare crowd control measures',
                    'Coordinate with protest organizers'
                ],
                'generated_at': datetime.now().isoformat()
            })
        
        # Legal change alert
        legal_articles = [a for a in self.demo_articles if any('law' in kw[0] or 'bill' in kw[0] for kw in a['keywords'])]
        if legal_articles:
            alerts.append({
                'type': 'LEGAL_CHANGE_ALERT',
                'title': 'Legal Changes That May Impact Crime',
                'message': f'Detected {len(legal_articles)} articles about legal changes that could affect crime patterns.',
                'severity': 'medium',
                'articles': legal_articles[:2],
                'recommendations': [
                    'Review new legal implications',
                    'Update enforcement strategies',
                    'Educate officers on changes'
                ],
                'generated_at': datetime.now().isoformat()
            })
        
        return alerts

# Example usage
if __name__ == "__main__":
    scraper = DemoCrimeForecastScraper()
    result = scraper.run_forecast_analysis()
    
    print(f"\n=== DEMO CRIME FORECAST ANALYSIS ===")
    print(f"Total articles analyzed: {result['summary']['total_articles_analyzed']}")
    print(f"High risk articles: {result['summary']['high_risk_articles']}")
    print(f"Medium risk articles: {result['summary']['medium_risk_articles']}")
    print(f"Total alerts generated: {result['summary']['total_alerts_generated']}")
    
    print(f"\n=== ALERTS ===")
    for alert in result['alerts']:
        print(f"\n{alert['type']}: {alert['title']}")
        print(f"Severity: {alert['severity']}")
        print(f"Message: {alert['message']}")
        print(f"Recommendations: {', '.join(alert['recommendations'])}")

