import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import time
import random

class CrimeForecastScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Crime-related keywords and their severity levels
        self.crime_keywords = {
            'high_risk': [
                'riot', 'riots', 'rioting', 'mob violence', 'communal violence',
                'caste violence', 'religious violence', 'ethnic violence',
                'mass violence', 'violent protest', 'violent demonstration',
                'arson', 'vandalism', 'looting', 'rampage', 'unrest',
                'disturbance', 'clash', 'confrontation', 'conflict'
            ],
            'medium_risk': [
                'protest', 'demonstration', 'strike', 'bandh', 'hartal',
                'agitation', 'rally', 'march', 'sit-in', 'blockade',
                'roadblock', 'traffic jam', 'disruption', 'tension',
                'dispute', 'confrontation', 'standoff', 'deadlock'
            ],
            'legal_risk': [
                'new law', 'amendment', 'bill passed', 'legislation',
                'court order', 'judgment', 'verdict', 'ruling',
                'policy change', 'regulation', 'ban', 'prohibition',
                'restriction', 'curfew', 'section 144', 'emergency',
                'martial law', 'crackdown', 'raid', 'arrest'
            ],
            'social_risk': [
                'migration', 'displacement', 'eviction', 'demolition',
                'land dispute', 'property dispute', 'water dispute',
                'resource conflict', 'economic crisis', 'unemployment',
                'price rise', 'inflation', 'shortage', 'scarcity'
            ]
        }
        
        # News sources to scrape (Tamil Nadu and India focused)
        self.news_sources = [
            {
                'name': 'The Hindu',
                'url': 'https://www.thehindu.com/news/cities/chennai/',
                'selectors': {
                    'articles': 'div[data-vr-zone="main"] article, .story-card',
                    'title': 'h3 a, .story-card-news h3 a',
                    'link': 'h3 a',
                    'content': '.story-card-news p, .intro'
                }
            },
            {
                'name': 'Times of India',
                'url': 'https://timesofindia.indiatimes.com/city/chennai',
                'selectors': {
                    'articles': '.list5 li, .list8 li',
                    'title': 'a',
                    'link': 'a',
                    'content': '.list5 li span, .list8 li span'
                }
            },
            {
                'name': 'Deccan Chronicle',
                'url': 'https://www.deccanchronicle.com/city/chennai',
                'selectors': {
                    'articles': '.col-sm-6 .card, .col-md-6 .card',
                    'title': '.card-title a, h3 a',
                    'link': '.card-title a, h3 a',
                    'content': '.card-text, .intro'
                }
            }
        ]

    def extract_keywords_from_text(self, text: str) -> List[Tuple[str, str, int]]:
        """Extract crime-related keywords from text and return with severity and count"""
        found_keywords = []
        text_lower = text.lower()
        
        for severity, keywords in self.crime_keywords.items():
            for keyword in keywords:
                # Count occurrences of keyword
                count = len(re.findall(r'\b' + re.escape(keyword) + r'\b', text_lower))
                if count > 0:
                    found_keywords.append((keyword, severity, count))
        
        return found_keywords

    def scrape_news_source(self, source: Dict) -> List[Dict]:
        """Scrape a single news source for crime-related articles"""
        articles = []
        
        try:
            print(f"Scraping {source['name']}...")
            response = self.session.get(source['url'], timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            article_elements = soup.select(source['selectors']['articles'])
            
            for element in article_elements[:10]:  # Limit to 10 articles per source
                try:
                    # Extract title
                    title_element = element.select_one(source['selectors']['title'])
                    if not title_element:
                        continue
                    
                    title = title_element.get_text(strip=True)
                    link = title_element.get('href', '')
                    
                    # Make absolute URL
                    if link and not link.startswith('http'):
                        if link.startswith('/'):
                            link = 'https://' + source['url'].split('/')[2] + link
                        else:
                            link = source['url'] + link
                    
                    # Extract content snippet
                    content_element = element.select_one(source['selectors']['content'])
                    content = content_element.get_text(strip=True) if content_element else ""
                    
                    # Combine title and content for keyword analysis
                    full_text = f"{title} {content}"
                    
                    # Extract keywords
                    keywords = self.extract_keywords_from_text(full_text)
                    
                    if keywords:  # Only include articles with crime-related keywords
                        articles.append({
                            'title': title,
                            'link': link,
                            'content': content,
                            'source': source['name'],
                            'keywords': keywords,
                            'scraped_at': datetime.now().isoformat(),
                            'severity': self._calculate_article_severity(keywords)
                        })
                
                except Exception as e:
                    print(f"Error processing article from {source['name']}: {e}")
                    continue
            
            # Add delay between requests
            time.sleep(random.uniform(1, 3))
            
        except Exception as e:
            print(f"Error scraping {source['name']}: {e}")
        
        return articles

    def _calculate_article_severity(self, keywords: List[Tuple[str, str, int]]) -> str:
        """Calculate overall severity of an article based on keywords"""
        severity_scores = {'high_risk': 3, 'medium_risk': 2, 'legal_risk': 2, 'social_risk': 1}
        
        total_score = 0
        keyword_count = 0
        
        for keyword, severity, count in keywords:
            total_score += severity_scores.get(severity, 1) * count
            keyword_count += count
        
        if keyword_count == 0:
            return 'low'
        
        avg_score = total_score / keyword_count
        
        if avg_score >= 2.5:
            return 'high'
        elif avg_score >= 1.5:
            return 'medium'
        else:
            return 'low'

    def scrape_all_sources(self) -> List[Dict]:
        """Scrape all news sources for crime-related articles"""
        all_articles = []
        
        for source in self.news_sources:
            articles = self.scrape_news_source(source)
            all_articles.extend(articles)
        
        # Sort by severity and keyword count
        all_articles.sort(key=lambda x: (
            {'high': 3, 'medium': 2, 'low': 1}[x['severity']],
            sum(count for _, _, count in x['keywords'])
        ), reverse=True)
        
        return all_articles

    def generate_crime_forecast_alerts(self, articles: List[Dict]) -> List[Dict]:
        """Generate crime forecast alerts based on scraped articles"""
        alerts = []
        
        # Group articles by severity
        high_risk_articles = [a for a in articles if a['severity'] == 'high']
        medium_risk_articles = [a for a in articles if a['severity'] == 'medium']
        
        # Generate alerts based on patterns
        if len(high_risk_articles) >= 3:
            alerts.append({
                'type': 'HIGH_RISK_ALERT',
                'title': 'Multiple High-Risk Crime Indicators Detected',
                'message': f'Found {len(high_risk_articles)} articles indicating potential high-risk criminal activity. Monitor areas mentioned in these reports.',
                'severity': 'high',
                'articles': high_risk_articles[:3],
                'recommendations': [
                    'Increase police patrols in affected areas',
                    'Monitor social media for escalation',
                    'Prepare emergency response protocols'
                ],
                'generated_at': datetime.now().isoformat()
            })
        
        if len(medium_risk_articles) >= 5:
            alerts.append({
                'type': 'MEDIUM_RISK_ALERT',
                'title': 'Elevated Crime Risk Indicators',
                'message': f'Detected {len(medium_risk_articles)} articles suggesting potential criminal activity. Stay vigilant.',
                'severity': 'medium',
                'articles': medium_risk_articles[:3],
                'recommendations': [
                    'Monitor situation closely',
                    'Prepare contingency plans',
                    'Inform community leaders'
                ],
                'generated_at': datetime.now().isoformat()
            })
        
        # Check for specific keyword patterns
        riot_articles = [a for a in articles if any('riot' in keyword.lower() for keyword, _, _ in a['keywords'])]
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
        
        legal_articles = [a for a in articles if any('law' in keyword.lower() or 'court' in keyword.lower() for keyword, _, _ in a['keywords'])]
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

    def run_forecast_analysis(self) -> Dict:
        """Run complete crime forecast analysis"""
        print("Starting crime forecast analysis...")
        
        # Scrape news sources
        articles = self.scrape_all_sources()
        
        # Generate alerts
        alerts = self.generate_crime_forecast_alerts(articles)
        
        # Create summary
        summary = {
            'total_articles_analyzed': len(articles),
            'high_risk_articles': len([a for a in articles if a['severity'] == 'high']),
            'medium_risk_articles': len([a for a in articles if a['severity'] == 'medium']),
            'low_risk_articles': len([a for a in articles if a['severity'] == 'low']),
            'total_alerts_generated': len(alerts),
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        return {
            'summary': summary,
            'articles': articles,
            'alerts': alerts
        }

# Example usage and testing
if __name__ == "__main__":
    scraper = CrimeForecastScraper()
    result = scraper.run_forecast_analysis()
    
    print(f"\n=== CRIME FORECAST ANALYSIS ===")
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

