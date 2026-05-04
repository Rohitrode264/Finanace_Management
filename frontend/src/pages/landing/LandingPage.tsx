import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Users, Sparkles, MonitorPlay } from 'lucide-react';
import './LandingPage.css';

export function LandingPage() {
    return (
        <div className="landing-wrapper">
            {/* Navbar */}
            <nav className="landing-navbar">
                <div className="landing-container nav-content">
                    <div className="landing-logo">
                        <GraduationCap className="logo-icon" size={32} />
                        <span className="logo-text">New Career Point</span>
                    </div>
                    <div className="nav-links">
                        <a href="#about">About</a>
                        <a href="#features">Features</a>
                        <a href="#programs">Programs</a>
                    </div>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-login">Admin Portal</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="landing-container hero-grid">
                    <div className="hero-content">
                        <div className="badge-pill">
                            <Sparkles size={14} className="badge-icon" />
                            <span>Empowering Future Leaders</span>
                        </div>
                        <h1 className="hero-title">
                            Ignite Your <span className="text-gradient">Career Potential</span>
                        </h1>
                        <p className="hero-subtitle">
                            Join New Career Point to unlock world-class coaching, comprehensive learning materials, and dedicated mentorship for your academic and professional journey.
                        </p>
                        <div className="hero-cta-group">
                            <Link to="/login" className="btn-primary-lg">
                                Get Started <ArrowRight size={20} />
                            </Link>
                            <a href="#features" className="btn-secondary-lg">
                                Explore Programs
                            </a>
                        </div>
                        
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-value">10k+</span>
                                <span className="stat-label">Students Enrolled</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">95%</span>
                                <span className="stat-label">Success Rate</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">50+</span>
                                <span className="stat-label">Expert Mentors</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="glass-card visual-card">
                            <img 
                                src="/images/hero_illustration.png" 
                                alt="Abstract career growth" 
                                className="hero-image"
                            />
                            <div className="floating-badge badge-1">
                                <MonitorPlay size={20} />
                                <span>Interactive Learning</span>
                            </div>
                            <div className="floating-badge badge-2">
                                <Users size={20} />
                                <span>1-on-1 Mentorship</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Background Decor */}
                <div className="bg-glow glow-1"></div>
                <div className="bg-glow glow-2"></div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="landing-container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose New Career Point?</h2>
                        <p className="section-subtitle">We provide a holistic educational ecosystem designed to accelerate learning and maximize outcomes.</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-visual">
                            <div className="glass-card feature-img-card">
                                <img src="/images/features_illustration.png" alt="Educational features" className="feature-image" />
                            </div>
                        </div>
                        <div className="feature-cards">
                            <div className="feature-card">
                                <div className="icon-wrapper bg-indigo">
                                    <BookOpen size={24} />
                                </div>
                                <h3>Comprehensive Curriculum</h3>
                                <p>Master concepts with our expertly designed study materials, regular assessments, and conceptual clarity sessions.</p>
                            </div>
                            <div className="feature-card">
                                <div className="icon-wrapper bg-purple">
                                    <GraduationCap size={24} />
                                </div>
                                <h3>Expert Faculty</h3>
                                <p>Learn from industry veterans and top educators dedicated to guiding you through every step of your preparation.</p>
                            </div>
                            <div className="feature-card">
                                <div className="icon-wrapper bg-cyan">
                                    <Users size={24} />
                                </div>
                                <h3>Personalized Attention</h3>
                                <p>We maintain small batch sizes to ensure individual focus, robust doubt-clearing sessions, and tailored feedback.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="landing-container">
                    <div className="glass-card cta-card">
                        <h2>Ready to transform your future?</h2>
                        <p>Enroll today and take the first step towards academic excellence and career success.</p>
                        <Link to="/login" className="btn-primary-lg">
                            Join Us Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container footer-content">
                    <div className="footer-brand">
                        <div className="landing-logo">
                            <GraduationCap className="logo-icon" size={24} />
                            <span className="logo-text">New Career Point</span>
                        </div>
                        <p className="footer-desc">Shaping minds, building careers. Your trusted partner in educational excellence.</p>
                    </div>
                    <div className="footer-links">
                        <div className="link-column">
                            <h4>Company</h4>
                            <a href="#about">About Us</a>
                            <a href="#careers">Careers</a>
                            <a href="#contact">Contact</a>
                        </div>
                        <div className="link-column">
                            <h4>Resources</h4>
                            <a href="#blog">Blog</a>
                            <a href="#materials">Study Materials</a>
                            <a href="#faq">FAQ</a>
                        </div>
                        <div className="link-column">
                            <h4>Legal</h4>
                            <a href="#privacy">Privacy Policy</a>
                            <a href="#terms">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="landing-container footer-bottom">
                    <p>&copy; {new Date().getFullYear()} New Career Point. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
