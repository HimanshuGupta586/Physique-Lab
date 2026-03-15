import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getWeights, reset as resetWeight } from '../store/weightSlice';
import { getWorkouts, reset as resetWorkout } from '../store/workoutSlice';
import { getDailyDiet, reset as resetDiet } from '../store/dietSlice';
import { Activity, Scale, Apple, TrendingUp, Sun, Moon, Sunset } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { weights, isLoading: weightLoading } = useSelector((state) => state.weight);
    const { workouts, isLoading: workoutLoading } = useSelector((state) => state.workout);
    const { dailyLog, isLoading: dietLoading } = useSelector((state) => state.diet);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const todayStr = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();

        dispatch(getWeights());
        dispatch(getWorkouts());
        dispatch(getDailyDiet(todayStr));

        return () => {
            dispatch(resetWeight());
            dispatch(resetWorkout());
            dispatch(resetDiet());
        };
    }, [user, navigate, dispatch]);

    // Data Aggregation
    const latestWeight = weights?.length > 0 ? weights[0].weight : '--';
    const latestWorkout = workouts?.length > 0 ? workouts[0].name : 'No recent';
    
    // Macro Data
    const cals = dailyLog?.totalCalories || 0;
    const protein = dailyLog?.totalProtein || 0;
    const carbs = dailyLog?.totalCarbs || 0;
    const fat = dailyLog?.totalFat || 0;
    const maintCals = user?.maintenanceCalories || 2000;
    const calPercentage = Math.min((cals / maintCals) * 100, 100);

    // Dynamic Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: "Good Morning", icon: Sun, color: "text-amber-400" };
        if (hour < 18) return { text: "Good Afternoon", icon: Sun, color: "text-orange-400" };
        return { text: "Good Evening", icon: Moon, color: "text-indigo-400" };
    };
    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;

    // Format chart data (reverse to show chronological order)
    const weightChartData = useMemo(() => {
        if (!weights || weights.length === 0) return [];
        return weights.slice(0, 10).reverse().map(w => ({
            date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            weight: w.weight
        }));
    }, [weights]);


    // Custom UI Components
    const ProgressBar = ({ label, current, max, color, bgColor }) => (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">{label}</span>
                <span className="text-slate-300 font-bold">{current} <span className="text-slate-500 font-normal">/ {max}</span></span>
            </div>
            <div className={`h-2 w-full ${bgColor} rounded-full overflow-hidden`}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((current/max)*100, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="animate-fade-in relative z-10 w-full max-w-7xl mx-auto space-y-8">
            {/* Header / Greeting */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <GreetingIcon className={`w-8 h-8 ${greeting.color}`} />
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-accent">
                            {greeting.text}, {user.name.split(' ')[0]}!
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm md:text-base font-medium">Ready to crush your goals today?</p>
                </div>
                
                <div className="relative z-10 hidden md:flex items-center gap-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Workouts</p>
                        <p className="text-2xl font-black text-teal-400">{workouts?.length || 0}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-700" />
                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Goal Cals</p>
                        <p className="text-2xl font-black text-accent">{maintCals}</p>
                    </div>
                </div>
            </motion.div>

            {(weightLoading || workoutLoading || dietLoading) ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                </div>
            ) : (
                <>
                    {/* Top Topo Row: Macros & Weight Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Nutrition & Macros Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-xl flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-accent/20 rounded-xl">
                                        <Apple className="w-6 h-6 text-accent" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Today's Nutrition</h2>
                                </div>
                                <span className="px-3 py-1 bg-slate-900/50 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">Daily Log</span>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-sm font-medium mb-1">Consumed</span>
                                    <span className="text-4xl font-black text-white">{cals} <span className="text-base font-bold text-slate-500">kcal</span></span>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-slate-400 text-sm font-medium mb-1">Budget</span>
                                    <span className="text-4xl font-black text-accent">{maintCals} <span className="text-base font-bold text-slate-500">kcal</span></span>
                                </div>
                            </div>

                            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden mb-8 border border-slate-700/50 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${calPercentage}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className={`h-full ${calPercentage > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-accent/80 to-accent'}`}
                                />
                            </div>

                            <div className="space-y-5 mt-auto bg-slate-900/40 p-5 rounded-2xl border border-slate-700/30">
                                <ProgressBar label="Protein" current={protein} max={Math.round(maintCals * 0.3 / 4)} color="bg-blue-500" bgColor="bg-slate-800" />
                                <ProgressBar label="Carbs" current={carbs} max={Math.round(maintCals * 0.4 / 4)} color="bg-emerald-500" bgColor="bg-slate-800" />
                                <ProgressBar label="Fat" current={fat} max={Math.round(maintCals * 0.3 / 9)} color="bg-amber-500" bgColor="bg-slate-800" />
                            </div>
                        </motion.div>

                        {/* Recent Weight Trend Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-xl flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <Scale className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Weight Trend</h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 text-sm font-medium block">Current</span>
                                    <span className="text-2xl font-black text-white">{latestWeight} <span className="text-sm text-slate-500 min-w-[20px] inline-block">kg</span></span>
                                </div>
                            </div>
                            
                            <div className="flex-1 min-h-[200px] mt-4 relative">
                                {weightChartData.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <XAxis 
                                                dataKey="date" 
                                                stroke="#475569" 
                                                fontSize={12} 
                                                tickLine={false}
                                                axisLine={false}
                                                minTickGap={20}
                                            />
                                            <YAxis 
                                                domain={['dataMin - 2', 'dataMax + 2']} 
                                                stroke="#475569" 
                                                fontSize={12} 
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => v.toFixed(1)}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#60a5fa' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="weight" 
                                                stroke="#3b82f6" 
                                                strokeWidth={4}
                                                dot={{ r: 4, fill: '#1e293b', stroke: '#3b82f6', strokeWidth: 2 }}
                                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                        <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                                        <p>Not enough data to graph.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Actions & Recent Activity */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Activity className="w-5 h-5 text-teal-400" /> Recent Workouts
                            </h2>
                            <div className="space-y-4">
                                {workouts.slice(0, 3).map((workout, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (index * 0.1) }}
                                        key={workout._id} 
                                        className="p-5 bg-gradient-to-r from-slate-800 to-slate-900/50 rounded-2xl border border-slate-700 hover:border-teal-500/40 transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group cursor-default"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all duration-300">
                                                <Activity className="w-6 h-6 text-teal-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-lg truncate group-hover:text-teal-400 transition-colors duration-300">{workout.name}</p>
                                                <p className="text-slate-400 text-sm mt-1">{new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</p>
                                            </div>
                                        </div>
                                        <div className="text-right sm:block flex items-center justify-between">
                                            <p className="text-slate-300 font-medium bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">{workout.duration} <span className="text-slate-500 text-xs">mins</span></p>
                                        </div>
                                    </motion.div>
                                ))}
                                {workouts.length === 0 && (
                                    <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-700/50 border-dashed">
                                        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium">No recent activity found.</p>
                                        <button onClick={() => navigate('/workouts')} className="mt-5 px-6 py-2 bg-teal-500/10 text-teal-400 rounded-xl hover:bg-teal-500/20 hover:scale-105 active:scale-95 transition-all font-bold">Log a Workout</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-xl flex flex-col">
                            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                            <div className="space-y-4 flex-1 flex flex-col justify-center">
                                <button
                                    onClick={() => navigate('/workouts')}
                                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-teal-500/10 to-transparent border border-teal-500/20 hover:border-teal-500/60 hover:from-teal-500/20 text-teal-400 rounded-2xl transition-all duration-300 group shadow-lg shadow-black/20"
                                >
                                    <span className="font-bold text-lg">Log Workout</span>
                                    <Activity className="w-6 h-6 group-hover:scale-110 group-active:scale-95 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/diet')}
                                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 hover:border-accent/60 hover:from-accent/20 text-accent rounded-2xl transition-all duration-300 group shadow-lg shadow-black/20"
                                >
                                    <span className="font-bold text-lg">Log Nutrition</span>
                                    <Apple className="w-6 h-6 group-hover:scale-110 group-active:scale-95 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/weights')}
                                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/60 hover:from-blue-500/20 text-blue-400 rounded-2xl transition-all duration-300 group shadow-lg shadow-black/20"
                                >
                                    <span className="font-bold text-lg">Log Weight</span>
                                    <Scale className="w-6 h-6 group-hover:scale-110 group-active:scale-95 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
