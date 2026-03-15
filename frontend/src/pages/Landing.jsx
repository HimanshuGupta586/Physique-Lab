import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Activity, Apple, LineChart, Shield, Zap, Target, Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Landing = () => {
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] w-full">
            {/* Hero Section */}
            <section className="flex flex-col items-center text-center pt-20 pb-24 md:pt-32 md:pb-32 px-4 animate-fade-in relative z-10 w-full max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-8 text-sm font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Zap size={16} />
                    <span>Your Ultimate Fitness Hub</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-accent mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Transform Your Body <br className="hidden md:block" /> With <span className="text-white">PhysiqueLab</span>
                </h1>

                <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    A professional, premium fitness tracking experience designed to help you monitor your workouts, nutrition, and weight goals all in one seamless platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    {user ? (
                        <Link to="/dashboard" className="px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-lg transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-2">
                            Go to Dashboard <Target size={20} />
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className="px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-lg transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-2">
                                Start Your Journey <Target size={20} />
                            </Link>
                            <Link to="/login" className="px-8 py-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-sm text-white font-medium text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center">
                                Login to Account
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm w-full relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need To Succeed</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Our comprehensive suite of tools ensures you stay on track, whether you're building muscle, losing fat, or maintaining.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-teal-500/50 transition-colors group">
                            <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Activity className="text-teal-400" size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Workout Tracking</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Log sets, reps, and weights with ease. Visualize your progressive overload and never forget your previous lifts.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-accent/50 transition-colors group">
                            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Apple className="text-accent" size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Diet & Nutrition</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Track your daily macros and calories. Integrated food database makes logging meals fast and accurate.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/50 transition-colors group">
                            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LineChart className="text-blue-400" size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Weight History</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Monitor your body weight trends over time. Interactive charts help you visualize your progress clearly.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About / Developer Section */}
            <section className="py-20 px-4 border-t border-slate-800/50 w-full relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/80 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">

                        {/* Decorative background blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>

                        <div className="flex-1 text-center md:text-left z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 mb-4 text-xs font-semibold tracking-wider uppercase text-slate-300">
                                <Shield size={14} /> Meet the Developer
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Crafted with passion.</h2>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                I am Himanshu Gupta, a Full Stack Developer dedicated to crafting high-performance, user-centric solutions. PhysiqueLab is meticulously architected to deliver a fast, scalable, and intuitive tracking experience. By focusing on essential, premium features, it empowers users to achieve their goals without the distraction of unnecessary bloat.
                            </p>

                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <a href="https://github.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-slate-300 hover:text-white" aria-label="GitHub">
                                    <Github size={20} />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-slate-300 hover:text-white" aria-label="Twitter">
                                    <Twitter size={20} />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-slate-300 hover:text-white" aria-label="LinkedIn">
                                    <Linkedin size={20} />
                                </a>
                                <a href="mailto:hello@example.com" className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-slate-300 hover:text-white" aria-label="Email">
                                    <Mail size={20} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto py-8 px-4 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-sm relative z-10 w-screen flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm xl:px-20 mx-[calc(-50vw+50%)]">
                <div className="flex items-center gap-2 mb-4 md:mb-0">
                    <Zap size={16} className="text-teal-500 hidden md:inline-block" />
                    <p>&copy; {new Date().getFullYear()} PhysiqueLab.</p>
                </div>

                <p>
                    Crafted by <span className="text-slate-400 font-medium tracking-wide">Himanshu Gupta</span>
                </p>
            </footer>
        </div>
    );
};

export default Landing;
