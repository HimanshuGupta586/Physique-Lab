import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout, getRoutines, createRoutine, updateRoutine, deleteRoutine, reset } from '../store/workoutSlice';
import { Activity, Plus, Loader2, Dumbbell, Settings2, Save, Edit2, Trash2, X, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Constants
const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core', 'Full Body'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WorkoutTracker = () => {
    // UI Tabs State
    const [activeTab, setActiveTab] = useState('log'); // 'log' or 'routines'

    // Log Form State
    const [selectedRoutine, setSelectedRoutine] = useState('');
    const [logName, setLogName] = useState('');
    const [duration, setDuration] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [exerciseLogs, setExerciseLogs] = useState([]);

    // Routine Form State
    const [routineName, setRoutineName] = useState('');
    const [splitType, setSplitType] = useState('Full Body');
    const [routineMuscles, setRoutineMuscles] = useState([]);
    const [routineDays, setRoutineDays] = useState([]);
    const [routineExercises, setRoutineExercises] = useState([{ name: '', targetSets: 3, targetReps: 10 }]);

    // Edit State for Workouts
    const [workoutEditingId, setWorkoutEditingId] = useState(null);
    const [editWorkoutName, setEditWorkoutName] = useState('');
    const [editWorkoutDuration, setEditWorkoutDuration] = useState('');
    const [editWorkoutDate, setEditWorkoutDate] = useState('');

    // Edit State for Routines
    const [routineEditingId, setRoutineEditingId] = useState(null);
    const [editRoutineName, setEditRoutineName] = useState('');
    const [editRoutineSplitType, setEditRoutineSplitType] = useState('Full Body');
    const [editRoutineMuscles, setEditRoutineMuscles] = useState([]);
    const [editRoutineDays, setEditRoutineDays] = useState([]);
    const [editRoutineExercises, setEditRoutineExercises] = useState([]);

    // Inline delete confirmation state
    const [deletingWorkoutId, setDeletingWorkoutId] = useState(null);
    const [deletingRoutineId, setDeletingRoutineId] = useState(null);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { workouts, routines, isLoading, isError, message } = useSelector(
        (state) => state.workout
    );

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
        dispatch(getRoutines());
        return () => { dispatch(reset()); };
    }, [user, navigate, dispatch]);

    // Handle Log Selection
    useEffect(() => {
        if (selectedRoutine) {
            const routine = routines.find(r => r._id === selectedRoutine);
            if (routine) {
                setLogName(routine.name);
                // Pre-fill exercise logs based on routine template
                const initialLogs = routine.exercises.map(ex => ({
                    name: ex.name,
                    sets: Array.from({ length: ex.targetSets }, () => ({ reps: ex.targetReps, weight: 0 }))
                }));
                setExerciseLogs(initialLogs);
            }
        } else {
            setLogName('');
            setExerciseLogs([]);
        }
    }, [selectedRoutine, routines]);


    // Handle Log Submit
    const onLogSubmit = (e) => {
        e.preventDefault();

        // Interpret the selected date in local time, fallback to noon to avoid UTC midnight shifts
        let finalDate;
        const todayStr = (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })();

        if (date === todayStr) {
            finalDate = new Date().toISOString();
        } else {
            const [y, m, d] = date.split('-');
            finalDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();
        }

        dispatch(createWorkout({
            name: logName,
            duration: Number(duration),
            date: finalDate,
            routineId: selectedRoutine || undefined,
            exercises: exerciseLogs.map(ex => ({
                name: ex.name,
                sets: ex.sets.filter(s => s.weight > 0 || s.reps > 0)
            }))
        }))
            .unwrap()
            .then(() => {
                toast.success('Workout saved!');
                setLogName('');
                setDuration('');
                setSelectedRoutine('');
                setDate(todayStr);
                setExerciseLogs([]);
            })
            .catch((err) => toast.error(err || 'Failed to save workout.'));
    };

    const onRoutineSubmit = (e) => {
        e.preventDefault();
        dispatch(createRoutine({
            name: routineName,
            splitType,
            targetMuscles: routineMuscles,
            targetDays: routineDays,
            exercises: routineExercises
        }))
            .unwrap()
            .then(() => {
                toast.success('Routine created!');
                setRoutineName('');
                setRoutineMuscles([]);
                setRoutineDays([]);
                setRoutineExercises([{ name: '', targetSets: 3, targetReps: 10 }]);
                setActiveTab('log');
            })
            .catch((err) => toast.error(err || 'Failed to create routine.'));
    };

    // Helper for Set updating
    const updateSet = (exerciseIndex, setIndex, field, value) => {
        const newLogs = [...exerciseLogs];
        newLogs[exerciseIndex].sets[setIndex][field] = value;
        setExerciseLogs(newLogs);
    };

    // --- WORKOUT EDIT & DELETE HANDLERS ---
    const startWorkoutEdit = (entry) => {
        setWorkoutEditingId(entry._id);
        setEditWorkoutName(entry.name);
        setEditWorkoutDuration(entry.duration);
        const d = new Date(entry.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setEditWorkoutDate(`${year}-${month}-${day}`);
    };

    const cancelWorkoutEdit = () => {
        setWorkoutEditingId(null);
    };

    const onWorkoutUpdate = (e, id) => {
        e.preventDefault();
        const finalDate = new Date(editWorkoutDate).toISOString();
        dispatch(updateWorkout({
            id,
            workoutData: {
                name: editWorkoutName,
                duration: Number(editWorkoutDuration),
                date: finalDate
            }
        }))
            .unwrap()
            .then(() => { toast.success('Workout updated!'); setWorkoutEditingId(null); })
            .catch((err) => toast.error(err || 'Failed to update.'));
    };

    const onWorkoutDelete = (id) => {
        dispatch(deleteWorkout(id))
            .unwrap()
            .then(() => { toast.success('Workout deleted.'); setDeletingWorkoutId(null); })
            .catch((err) => toast.error(err || 'Failed to delete.'));
    };

    // --- ROUTINE EDIT & DELETE HANDLERS ---
    const startRoutineEdit = (routine) => {
        setRoutineEditingId(routine._id);
        setEditRoutineName(routine.name);
        setEditRoutineSplitType(routine.splitType);
        setEditRoutineMuscles(routine.targetMuscles || []);
        setEditRoutineDays(routine.targetDays || []);
        // deep copy exercises to avoid mutating original
        setEditRoutineExercises(JSON.parse(JSON.stringify(routine.exercises)));
    };

    const cancelRoutineEdit = () => {
        setRoutineEditingId(null);
    };

    const onRoutineUpdate = (e, id) => {
        e.preventDefault();
        dispatch(updateRoutine({
            id,
            routineData: {
                name: editRoutineName,
                splitType: editRoutineSplitType,
                targetMuscles: editRoutineMuscles,
                targetDays: editRoutineDays,
                exercises: editRoutineExercises
            }
        }))
            .unwrap()
            .then(() => { toast.success('Routine updated!'); setRoutineEditingId(null); })
            .catch((err) => toast.error(err || 'Failed to update routine.'));
    };

    const onRoutineDelete = (id) => {
        dispatch(deleteRoutine(id))
            .unwrap()
            .then(() => { toast.success('Routine deleted.'); setDeletingRoutineId(null); })
            .catch((err) => toast.error(err || 'Failed to delete routine.'));
    };

    const updateEditRoutineExercise = (index, field, value) => {
        const updated = [...editRoutineExercises];
        updated[index][field] = value;
        setEditRoutineExercises(updated);
    };

    const addEditRoutineExercise = () => {
        setEditRoutineExercises([...editRoutineExercises, { name: '', targetSets: 3, targetReps: 10 }]);
    };

    const removeEditRoutineExercise = (index) => {
        const updated = editRoutineExercises.filter((_, i) => i !== index);
        setEditRoutineExercises(updated);
    };

    const toggleSelection = (array, setArray, item) => {
        if (array.includes(item)) {
            setArray(array.filter(i => i !== item));
        } else {
            setArray([...array, item]);
        }
    };


    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative z-10 w-full pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/20 rounded-xl">
                        <Activity className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Workout Tracker</h1>
                        <p className="text-slate-400">Log guided routines or free sessions</p>
                    </div>
                </div>

                {/* Tab Toggle */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('log')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'log' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Activity className="w-4 h-4" /> Log Session
                    </button>
                    <button
                        onClick={() => setActiveTab('routines')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'routines' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Settings2 className="w-4 h-4" /> Routines
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'log' ? (
                    <motion.div
                        key="log"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* LOGGING FORM */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                                <form onSubmit={onLogSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Select Routine</label>
                                            <div className="relative w-full">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-white appearance-none"
                                                    value={selectedRoutine}
                                                    onChange={(e) => setSelectedRoutine(e.target.value)}
                                                >
                                                    <option value="">-- Free Session --</option>
                                                    {routines.map(r => (
                                                        <option key={r._id} value={r._id}>{r.name} ({r.splitType})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Session Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-white"
                                                value={logName}
                                                onChange={(e) => setLogName(e.target.value)}
                                                placeholder="e.g. Ad-hoc Cardio"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-white appearance-none"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                max={(() => {
                                                    const d = new Date();
                                                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                })()}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Exercise Rendering */}
                                    {selectedRoutine && exerciseLogs.length > 0 && (
                                        <div className="space-y-6 mt-6 border-t border-slate-700 pt-6">
                                            <h3 className="text-lg font-bold text-white">Log Sets</h3>
                                            {exerciseLogs.map((exercise, exIdx) => (
                                                <div key={exIdx} className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl">
                                                    <p className="text-accent font-semibold mb-3">{exercise.name}</p>
                                                    <div className="space-y-2">
                                                        {exercise.sets.map((set, setIdx) => (
                                                            <div key={setIdx} className={`flex flex-wrap items-center gap-2 p-3 sm:p-2 rounded-lg transition-colors bg-slate-800`}>
                                                                <span className="text-slate-500 w-12 sm:w-8 text-sm font-medium">Set {setIdx + 1}</span>
                                                                <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="kg"
                                                                        value={set.weight || ''}
                                                                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                                                                        className="w-16 sm:w-16 bg-slate-900 border border-slate-700 rounded p-1.5 sm:p-1 text-center text-white outline-none focus:border-accent flex-1"
                                                                    />
                                                                    <span className="text-slate-500 text-sm">x</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="reps"
                                                                        value={set.reps || ''}
                                                                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                                                                        className="w-16 sm:w-16 bg-slate-900 border border-slate-700 rounded p-1.5 sm:p-1 text-center text-white outline-none focus:border-accent flex-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Total Duration (mins)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-white max-w-[200px]"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            placeholder="e.g. 60"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent/25 flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Finish & Save Workout</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* HISTORY SIDEBAR */}
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
                            {workouts.length > 0 ? (
                                <div className="space-y-3">
                                    {workouts.slice(0, 5).map((entry, idx) => (
                                        workoutEditingId === entry._id ? (
                                            <motion.div
                                                key={`edit-${entry._id}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-slate-800/80 backdrop-blur-xl border border-accent/50 p-4 rounded-xl shadow-lg ring-1 ring-accent/30"
                                            >
                                                <form onSubmit={(e) => onWorkoutUpdate(e, entry._id)} className="space-y-3">
                                                    <input type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-accent text-sm" value={editWorkoutName} onChange={e => setEditWorkoutName(e.target.value)} required placeholder="Session Name" />
                                                    <div className="flex gap-3">
                                                        <input type="date" className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-accent text-sm" value={editWorkoutDate} onChange={e => setEditWorkoutDate(e.target.value)} required />
                                                        <input type="number" className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-accent text-sm" value={editWorkoutDuration} onChange={e => setEditWorkoutDuration(e.target.value)} required placeholder="Duration (mins)" />
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button type="button" onClick={cancelWorkoutEdit} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors flex items-center gap-1 text-xs shadow-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
                                                        <button type="submit" disabled={isLoading} className="px-3 py-1.5 bg-accent hover:bg-accent-hover rounded-lg text-white transition-colors flex items-center gap-1 text-xs shadow-sm">{isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save</button>
                                                    </div>
                                                </form>
                                            </motion.div>
                                        ) : deletingWorkoutId === entry._id ? (
                                            <motion.div key={`del-${entry._id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-xl">
                                                <p className="text-white font-semibold text-sm mb-1">Delete this workout?</p>
                                                <p className="text-slate-400 text-xs mb-3">{entry.name} — {entry.duration} mins</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setDeletingWorkoutId(null)} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium transition-colors">Cancel</button>
                                                    <button onClick={() => onWorkoutDelete(entry._id)} className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-400 rounded-lg text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3" /> Delete</>}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={entry._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl hover:border-accent/30 transition-colors group relative"
                                            >
                                                <div className="flex justify-between items-start mb-2 pr-12">
                                                    <div>
                                                        <p className="text-lg font-bold text-white">{entry.name}</p>
                                                        {entry.routine?.splitType && <p className="text-xs text-accent">{entry.routine.splitType}</p>}
                                                    </div>
                                                    <p className="text-slate-400 text-sm">{new Date(entry.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2 pt-2 border-t border-slate-700/50">
                                                    <span>{entry.duration} mins</span>
                                                    <span>{entry.exercises?.length || 0} exercises</span>
                                                </div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                                    <button onClick={() => startWorkoutEdit(entry)} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-slate-300 transition-colors" title="Edit Workout">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => setDeletingWorkoutId(entry._id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Delete Workout">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/30 border-dashed">
                                    <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">No workouts logged.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="routines"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* ROUTINE BUILDER */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                            <form onSubmit={onRoutineSubmit} className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Create Routine</h2>
                                    <p className="text-sm text-slate-400">Design a template to track exact sets and reps</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Routine Name</label>
                                        <input type="text" className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white" value={routineName} onChange={e => setRoutineName(e.target.value)} placeholder="Hypertrophy A" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Split Target</label>
                                        <div className="relative w-full">
                                            <select className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white outline-none focus:border-accent appearance-none" value={splitType} onChange={e => setSplitType(e.target.value)}>
                                                <option>Full Body</option>
                                                <option>Push</option>
                                                <option>Pull</option>
                                                <option>Legs</option>
                                                <option>Upper</option>
                                                <option>Lower</option>
                                                <option>Cardio</option>
                                                <option>Custom</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Target Muscles</label>
                                        <div className="flex flex-wrap gap-2">
                                            {MUSCLE_GROUPS.map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => toggleSelection(routineMuscles, setRoutineMuscles, m)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${routineMuscles.includes(m) ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Target Days (Rest days implied)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => toggleSelection(routineDays, setRoutineDays, d)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-colors border ${routineDays.includes(d) ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-700 pt-4">
                                    <p className="font-semibold text-white mb-2">Exercises</p>
                                    <div className="space-y-3">
                                        {routineExercises.map((ex, i) => (
                                            <div key={i} className="flex flex-col sm:flex-row gap-2 bg-slate-900/30 p-2 sm:p-0 rounded-lg sm:bg-transparent sm:border-0 border border-slate-700/50">
                                                <input type="text" placeholder="Exercise Name" value={ex.name} onChange={e => {
                                                    const n = [...routineExercises]; n[i].name = e.target.value; setRoutineExercises(n);
                                                }} className="w-full sm:flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white" required />
                                                <div className="flex gap-2">
                                                    <input type="number" placeholder="Sets" value={ex.targetSets} onChange={e => {
                                                        const n = [...routineExercises]; n[i].targetSets = Number(e.target.value); setRoutineExercises(n);
                                                    }} className="flex-1 sm:w-20 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white" required title="Target Sets" />
                                                    <input type="number" placeholder="Reps" value={ex.targetReps} onChange={e => {
                                                        const n = [...routineExercises]; n[i].targetReps = Number(e.target.value); setRoutineExercises(n);
                                                    }} className="flex-1 sm:w-20 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-white" required title="Target Reps" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => setRoutineExercises([...routineExercises, { name: '', targetSets: 3, targetReps: 10 }])} className="text-accent text-sm font-medium mt-3 hover:text-accent-hover flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add Exercise
                                    </button>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all">
                                    Save Routine Template
                                </button>
                            </form>
                        </div>

                        {/* SAVED ROUTINES */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Your Routines</h2>
                            <div className="grid gap-4">
                                {routines.map((routine) => (
                                    routineEditingId === routine._id ? (
                                        <div key={`edit-${routine._id}`} className="bg-slate-800/80 backdrop-blur border border-accent/50 p-5 rounded-xl flex flex-col justify-between shadow-lg ring-1 ring-accent/30">
                                            <form onSubmit={(e) => onRoutineUpdate(e, routine._id)} className="space-y-4">
                                                <div className="flex gap-3">
                                                    <input type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-accent text-sm" value={editRoutineName} onChange={e => setEditRoutineName(e.target.value)} required placeholder="Routine Name" />
                                                    <div className="relative w-full">
                                                        <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-accent text-sm appearance-none" value={editRoutineSplitType} onChange={e => setEditRoutineSplitType(e.target.value)}>
                                                            <option>Full Body</option>
                                                            <option>Push</option>
                                                            <option>Pull</option>
                                                            <option>Legs</option>
                                                            <option>Upper</option>
                                                            <option>Lower</option>
                                                            <option>Cardio</option>
                                                            <option>Custom</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1.5">Muscles</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {MUSCLE_GROUPS.map(m => (
                                                                <button key={`edit-m-${m}`} type="button" onClick={() => toggleSelection(editRoutineMuscles, setEditRoutineMuscles, m)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${editRoutineMuscles.includes(m) ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                                                                    {m}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1.5">Days</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {DAYS_OF_WEEK.map(d => (
                                                                <button key={`edit-d-${d}`} type="button" onClick={() => toggleSelection(editRoutineDays, setEditRoutineDays, d)} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors border ${editRoutineDays.includes(d) ? 'bg-accent border-accent text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                                                                    {d}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 border-t border-slate-700/50 pt-2">
                                                    {editRoutineExercises.map((ex, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input type="text" placeholder="Exercise" value={ex.name} onChange={e => updateEditRoutineExercise(i, 'name', e.target.value)} className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white" required />
                                                            <input type="number" placeholder="Sets" value={ex.targetSets} onChange={e => updateEditRoutineExercise(i, 'targetSets', Number(e.target.value))} className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white" required />
                                                            <input type="number" placeholder="Reps" value={ex.targetReps} onChange={e => updateEditRoutineExercise(i, 'targetReps', Number(e.target.value))} className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white" required />
                                                            <button type="button" onClick={() => removeEditRoutineExercise(i)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-700 rounded"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={addEditRoutineExercise} className="text-accent text-xs font-medium mt-2 hover:text-accent-hover flex items-center gap-1"><Plus className="w-3 h-3" /> Add Exercise</button>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                                    <button type="button" onClick={cancelRoutineEdit} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors flex items-center gap-1 text-sm shadow-sm"><X className="w-4 h-4" /> Cancel</button>
                                                    <button type="submit" disabled={isLoading} className="px-3 py-1.5 bg-accent hover:bg-accent-hover rounded-lg text-white transition-colors flex items-center gap-1 text-sm shadow-sm">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Routine</button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : deletingRoutineId === routine._id ? (
                                        <div key={`del-routine-${routine._id}`} className="bg-rose-500/10 border border-rose-500/40 p-5 rounded-xl">
                                            <p className="text-white font-semibold mb-1">Delete this routine?</p>
                                            <p className="text-slate-400 text-sm mb-4">{routine.name} — {routine.splitType}</p>
                                            <div className="flex gap-3">
                                                <button onClick={() => setDeletingRoutineId(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors text-sm">Cancel</button>
                                                <button onClick={() => onRoutineDelete(routine._id)} className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 rounded-xl text-white font-bold transition-colors text-sm flex items-center justify-center gap-2">
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={routine._id} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-5 rounded-xl flex flex-col justify-between group relative">
                                            <div className="flex justify-between items-start mb-3 pr-16">
                                                <div>
                                                    <p className="text-lg font-bold text-white">{routine.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-accent text-sm font-semibold">{routine.splitType}</p>
                                                        {routine.targetDays?.length > 0 && (
                                                            <div className="flex gap-1 ml-2 pl-2 border-l border-slate-700/50">
                                                                {routine.targetDays.map(d => (
                                                                    <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">{d}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Dumbbell className="text-slate-600 w-5 h-5 absolute right-5 top-5 group-hover:opacity-0 transition-opacity" />
                                            </div>
                                            <div className="absolute top-5 right-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startRoutineEdit(routine)} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white rounded-md transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeletingRoutineId(routine._id)} className="p-1.5 bg-slate-700/80 hover:bg-rose-500/80 text-slate-300 hover:text-white rounded-md transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {routine.targetMuscles?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {routine.targetMuscles.map(m => (
                                                        <span key={m} className="text-[11px] font-medium text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-1 mt-auto font-mono text-xs text-slate-400">
                                                {routine.exercises.map((ex, i) => (
                                                    <span key={i} className="bg-slate-900 px-2 py-1 rounded">
                                                        {ex.name} ({ex.targetSets}x{ex.targetReps})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                                {routines.length === 0 && (
                                    <p className="text-slate-500">No routines built yet. Create one to start logging specific sets and reps during your workouts.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkoutTracker;
