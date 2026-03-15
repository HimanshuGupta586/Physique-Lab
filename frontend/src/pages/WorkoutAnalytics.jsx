import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getWorkouts, reset } from '../store/workoutSlice';
import { Activity, Dumbbell, TrendingUp, Calendar, Loader2, ChevronDown } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';

const WorkoutAnalytics = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { workouts, isLoading, isError, message } = useSelector(
        (state) => state.workout
    );

    const [selectedExercise, setSelectedExercise] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState(null);

    useEffect(() => {
        if (isError) {
            console.error(message);
        }
    }, [isError, message]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        dispatch(getWorkouts());
        return () => { dispatch(reset()); };
    }, [user, navigate, dispatch]);

    // Derived Analytics Data
    const analytics = useMemo(() => {
        if (!workouts || workouts.length === 0) {
            return {
                totalWorkouts: 0,
                totalVolume: 0,
                activeDays: 0,
                volumeData: [],
                allExercises: [],
                exerciseProgression: []
            };
        }

        let totalVolume = 0;
        const activeDaysSet = new Set();
        const volumeByDate = {};
        const exerciseHistory = {};
        const uniqueExercises = new Set();

        workouts.forEach(workout => {
            const dateStr = new Date(workout.date).toLocaleDateString();
            activeDaysSet.add(dateStr);

            let sessionVolume = 0;

            if (workout.exercises) {
                workout.exercises.forEach(ex => {
                    uniqueExercises.add(ex.name);

                    // Track max weight per session for this exercise
                    let maxWeightForSession = 0;

                    ex.sets.forEach(set => {
                        const setVolume = (set.weight || 0) * (set.reps || 0);
                        sessionVolume += setVolume;
                        totalVolume += setVolume;

                        if ((set.weight || 0) > maxWeightForSession) {
                            maxWeightForSession = set.weight;
                        }
                    });

                    // Store history for progression chart
                    if (!exerciseHistory[ex.name]) {
                        exerciseHistory[ex.name] = [];
                    }

                    // Only add if there was actually weight lifted
                    if (maxWeightForSession > 0) {
                        // Check if we already have an entry for this date to avoid duplicates, just update max
                        const existingEntry = exerciseHistory[ex.name].find(entry => entry.date === dateStr);
                        if (existingEntry) {
                            existingEntry.maxWeight = Math.max(existingEntry.maxWeight, maxWeightForSession);
                        } else {
                            exerciseHistory[ex.name].push({
                                date: dateStr,
                                rawDate: new Date(workout.date), // for sorting
                                maxWeight: maxWeightForSession
                            });
                        }
                    }
                });
            }

            // Aggregate volume
            if (volumeByDate[dateStr]) {
                volumeByDate[dateStr] += sessionVolume;
            } else {
                volumeByDate[dateStr] = sessionVolume;
            }
        });

        // Format Volume Data for Chart, sorted chronologically
        const volumeData = Object.keys(volumeByDate)
            .map(date => ({ date, volume: volumeByDate[date], rawDate: new Date(date) }))
            .sort((a, b) => a.rawDate - b.rawDate);

        // Sort exercise history chronologically
        Object.keys(exerciseHistory).forEach(ex => {
            exerciseHistory[ex].sort((a, b) => a.rawDate - b.rawDate);
        });

        const allExercises = Array.from(uniqueExercises).sort();

        // If no selected exercise, pick the first one available that has history
        let currentExercise = selectedExercise;
        if (!currentExercise && allExercises.length > 0) {
            const defaultEx = allExercises.find(ex => exerciseHistory[ex]?.length > 0);
            if (defaultEx) {
                currentExercise = defaultEx;
                setSelectedExercise(defaultEx); // Need to sync state but use local var for memo payload
            }
        }

        return {
            totalWorkouts: workouts.length,
            totalVolume,
            activeDays: activeDaysSet.size,
            volumeData,
            allExercises,
            exerciseProgression: exerciseHistory[selectedExercise] || exerciseHistory[currentExercise] || []
        };
    }, [workouts, selectedExercise]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 w-full pb-20">
            {/* HERDER */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/20 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Workout Analytics</h1>
                    <p className="text-slate-400">Track your volume, strength progression, and history</p>
                </div>
            </div>

            {/* ERROR HANDLING */}
            {workouts.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/30 border-dashed">
                    <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
                    <p className="text-slate-400">Log some workouts to see your analytics dashboard come to life!</p>
                    <button onClick={() => navigate('/workouts')} className="mt-6 px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors">
                        Go to Tracker
                    </button>
                </div>
            ) : (
                <>
                    {/* TOP METRICS SUMMARY */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4">
                            <div className="p-4 bg-teal-500/20 rounded-xl">
                                <Activity className="w-6 h-6 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400">Total Workouts</p>
                                <p className="text-2xl font-bold text-white">{analytics.totalWorkouts}</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4">
                            <div className="p-4 bg-accent/20 rounded-xl">
                                <Dumbbell className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400">Total Volume Lifted</p>
                                <p className="text-2xl font-bold text-white">{analytics.totalVolume.toLocaleString()} kg</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4">
                            <div className="p-4 bg-rose-500/20 rounded-xl">
                                <Calendar className="w-6 h-6 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400">Active Days</p>
                                <p className="text-2xl font-bold text-white">{analytics.activeDays}</p>
                            </div>
                        </div>
                    </div>

                    {/* CHARTS CONTAINER */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* CHART 1: VOLUME OVER TIME */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl">
                            <h2 className="text-lg font-bold text-white mb-6">Volume Progression</h2>
                            {analytics.volumeData.length > 1 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.volumeData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                                itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Bar dataKey="volume" name="Volume (kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
                                    <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                                    Not enough data points yet. Keep lifting!
                                </div>
                            )}
                        </div>

                        {/* CHART 2: SPECIFIC EXERCISE PROGRESSION */}
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <h2 className="text-lg font-bold text-white">Strength Progression</h2>
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={selectedExercise}
                                        onChange={(e) => setSelectedExercise(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-accent text-sm w-full sm:w-auto appearance-none pr-8"
                                    >
                                        <option value="" disabled>Select Exercise</option>
                                        {analytics.allExercises.map(ex => (
                                            <option key={ex} value={ex}>{ex}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {analytics.exerciseProgression.length > 1 ? (
                                <div className="h-[244px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics.exerciseProgression}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                            <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                                itemStyle={{ color: '#2dd4bf', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="maxWeight"
                                                name="Max Weight (kg)"
                                                stroke="#2dd4bf"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }}
                                                activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#fff' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[244px] flex flex-col items-center justify-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl text-center px-4">
                                    <Dumbbell className="w-8 h-8 mb-2 opacity-50" />
                                    No history recorded for this exercise yet. <br /> Log weights for it across multiple days to see your trend!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FULL SESSION HISTORY */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl overflow-hidden">
                        <h2 className="text-lg font-bold text-white mb-6">Complete Session History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">Session Name</th>
                                        <th className="pb-3 font-medium">Duration</th>
                                        <th className="pb-3 font-medium">Exercises Logged</th>
                                        <th className="pb-3 font-medium text-right">Volume</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workouts.map((workout, idx) => {
                                        let workVolume = 0;
                                        if (workout.exercises) {
                                            workout.exercises.forEach(ex => {
                                                ex.sets.forEach(set => {
                                                    workVolume += (set.weight || 0) * (set.reps || 0);
                                                });
                                            });
                                        }

                                        return (
                                            <React.Fragment key={workout._id}>
                                                <tr
                                                    onClick={() => setSelectedSessionId(selectedSessionId === workout._id ? null : workout._id)}
                                                    className={`border-b border-slate-700/50 transition-colors hover:bg-slate-800/80 cursor-pointer ${idx === workouts.length - 1 && selectedSessionId !== workout._id ? 'border-b-0' : ''} ${selectedSessionId === workout._id ? 'bg-slate-800' : ''}`}
                                                >
                                                    <td className="py-4 text-slate-300 whitespace-nowrap px-2">{new Date(workout.date).toLocaleDateString()}</td>
                                                    <td className="py-4 px-2">
                                                        <p className="font-semibold text-white">{workout.name}</p>
                                                        {workout.routine?.splitType && <p className="text-xs text-accent mt-0.5">{workout.routine.splitType}</p>}
                                                    </td>
                                                    <td className="py-4 text-slate-300 px-2">{workout.duration} min</td>
                                                    <td className="py-4 px-2">
                                                        <div className="flex flex-wrap gap-1 max-w-sm">
                                                            {workout.exercises?.slice(0, 3).map((ex, i) => (
                                                                <span key={i} className="text-xs bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                                                                    {ex.name}
                                                                </span>
                                                            ))}
                                                            {workout.exercises?.length > 3 && (
                                                                <span className="text-xs font-medium text-slate-500 px-1 py-0.5">+{workout.exercises.length - 3} more</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right font-mono text-accent px-2">{workVolume.toLocaleString()} kg</td>
                                                </tr>
                                                {/* EXPANDED SESSION DETAILS */}
                                                {selectedSessionId === workout._id && (
                                                    <tr className="bg-slate-900/50 border-b border-slate-700/50">
                                                        <td colSpan="5" className="p-6">
                                                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                                                                <h3 className="text-lg font-bold text-white mb-4">Session Details: {workout.name}</h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {workout.exercises?.map((ex, exIdx) => (
                                                                        <div key={exIdx} className="bg-slate-900/80 border border-slate-700/50 rounded-lg p-4">
                                                                            <p className="font-semibold text-accent mb-3">{ex.name}</p>
                                                                            <div className="space-y-2">
                                                                                {ex.sets.map((set, setIdx) => {
                                                                                    // Only show sets that have data
                                                                                    if ((set.weight || 0) === 0 && (set.reps || 0) === 0) return null;

                                                                                    return (
                                                                                        <div key={setIdx} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm">
                                                                                            <span className="text-slate-400">Set {setIdx + 1}</span>
                                                                                            <div className="font-mono text-slate-200">
                                                                                                {set.weight || 0} <span className="text-slate-500">kg</span> × {set.reps || 0} <span className="text-slate-500">reps</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                                {/* Count valid sets */}
                                                                                {ex.sets.filter(s => (s.weight || 0) > 0 || (s.reps || 0) > 0).length === 0 && (
                                                                                    <p className="text-slate-500 text-sm text-center italic py-2">No sets recorded</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(!workout.exercises || workout.exercises.length === 0) && (
                                                                        <div className="col-span-full text-center text-slate-500 py-4 italic">
                                                                            No exercises logged for this session.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkoutAnalytics;
