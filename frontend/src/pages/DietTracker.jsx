import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getDailyDiet, createDailyDiet, toggleMealCompletion, getDietRoutines, createDietRoutine, updateDietRoutine, deleteDietRoutine, deleteDailyDiet, changeDailyDietRoutine, reset } from '../store/dietSlice';
import { updateProfile } from '../store/authSlice';
import { Apple, Plus, Loader2, Save, Trash2, Edit2, ChevronDown, CheckCircle2, TrendingUp, TrendingDown, Minus, Circle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DietTracker = () => {
    const [activeTab, setActiveTab] = useState('log'); // 'log' or 'routines'

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { dailyLog, dietRoutines, isLoading, isError, message } = useSelector((state) => state.diet);

    // Maintenance Calorie Setup State
    const [isEditingMaintenance, setIsEditingMaintenance] = useState(false);
    const [maintenanceInput, setMaintenanceInput] = useState(user?.maintenanceCalories || 0);

    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcGender, setCalcGender] = useState('male');
    const [calcWeight, setCalcWeight] = useState('');
    const [calcHeight, setCalcHeight] = useState('');
    const [calcAge, setCalcAge] = useState('');
    const [calcActivity, setCalcActivity] = useState('1.2');

    // Routine Builder State
    const [isBuildingRoutine, setIsBuildingRoutine] = useState(false);
    const [editingRoutineId, setEditingRoutineId] = useState(null);
    const [deletingRoutineId, setDeletingRoutineId] = useState(null);
    const [deletingDailyLog, setDeletingDailyLog] = useState(false);
    const [switchingPlanId, setSwitchingPlanId] = useState('');
    const [routineName, setRoutineName] = useState('');
    const [routineMeals, setRoutineMeals] = useState([]); // Array of { name, calories, protein, carbs, fat }

    // Date Picker State
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const [selectedRoutineToStart, setSelectedRoutineToStart] = useState('');

    // --- EFFECT HOOKS ---
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
        dispatch(getDietRoutines());
        
        // Only reset on unmount, and don't depend on isError/message for fetching data
        return () => { dispatch(reset()); };
    }, [user, navigate, dispatch]);

    // Fetch daily diet whenever the date changes
    useEffect(() => {
        if (user) {
            dispatch(getDailyDiet(date));
        }
    }, [date, user, dispatch]);

    useEffect(() => {
        if (user) setMaintenanceInput(user.maintenanceCalories || 0);
    }, [user]);

    const handleSaveMaintenance = () => {
        dispatch(updateProfile({ maintenanceCalories: Number(maintenanceInput) }))
            .unwrap()
            .then(() => { toast.success('Maintenance calories updated!'); setIsEditingMaintenance(false); setShowCalculator(false); })
            .catch(() => toast.error('Failed to save. Please try again.'));
    };

    const handleCalculateBMR = async () => {
        if (!calcWeight || !calcHeight || !calcAge) return;
        
        // Mifflin-St Jeor Equation
        let bmr;
        if (calcGender === 'male') {
            bmr = (10 * Number(calcWeight)) + (6.25 * Number(calcHeight)) - (5 * Number(calcAge)) + 5;
        } else {
            bmr = (10 * Number(calcWeight)) + (6.25 * Number(calcHeight)) - (5 * Number(calcAge)) - 161;
        }
        
        const tdee = Math.round(bmr * Number(calcActivity));

        try {
            await dispatch(updateProfile({ maintenanceCalories: tdee })).unwrap();
            setMaintenanceInput(tdee);
            setShowCalculator(false);
            setIsEditingMaintenance(false);
            toast.success(`Calculated TDEE: ${tdee} kcal saved!`);
        } catch (err) {
            console.error(`ERROR SAVING TO DB: ${err}`);
            toast.error('Failed to save calculated calories.');
        }
    };

    // --- ROUTINE ACTIONS ---
    const handleAddMealToRoutine = () => {
        setRoutineMeals([...routineMeals, { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
    };

    const handleUpdateRoutineMeal = (index, field, value) => {
        setRoutineMeals(prevMeals =>
            prevMeals.map((meal, i) =>
                i === index ? { ...meal, [field]: field === 'name' ? value : Number(value) || 0 } : meal
            )
        );
    };

    const handleRemoveRoutineMeal = (index) => {
        setRoutineMeals(routineMeals.filter((_, i) => i !== index));
    };

    const handleSaveRoutine = (e) => {
        e.preventDefault();
        if (!routineName) return;

        const payload = {
            name: routineName,
            meals: routineMeals
        };

        if (editingRoutineId) {
            dispatch(updateDietRoutine({ _id: editingRoutineId, ...payload }))
                .unwrap()
                .then(() => { toast.success('Plan updated!'); })
                .catch(() => toast.error('Failed to update plan.'));
        } else {
            dispatch(createDietRoutine(payload))
                .unwrap()
                .then(() => { toast.success('Plan created!'); })
                .catch(() => toast.error('Failed to create plan.'));
        }

        setIsBuildingRoutine(false);
        setEditingRoutineId(null);
        setRoutineName('');
        setRoutineMeals([]);
    };

    const editRoutine = (routine) => {
        setIsBuildingRoutine(true);
        setEditingRoutineId(routine._id);
        setRoutineName(routine.name);
        setRoutineMeals(routine.meals || []);
    };

    // --- LOGGING ACTIONS ---
    const handleStartDay = (e) => {
        e.preventDefault();
        if (!selectedRoutineToStart) return;
        dispatch(createDailyDiet({ date, routineId: selectedRoutineToStart }))
            .unwrap()
            .then(() => { toast.success("Today's plan is ready. Start checking off meals!"); })
            .catch(() => toast.error('Failed to start the plan.'));
        setSelectedRoutineToStart('');
    };

    const handleToggleMeal = (mealIndex) => {
        if (!dailyLog) return;
        dispatch(toggleMealCompletion({ logId: dailyLog._id, mealIndex }));
    };

    const handleChangeDailyPlan = (e) => {
        const newRoutineId = e.target.value;
        if (newRoutineId) {
            setSwitchingPlanId(newRoutineId);
        }
    };

    const confirmSwitchPlan = () => {
        dispatch(changeDailyDietRoutine({ logId: dailyLog._id, routineId: switchingPlanId }))
            .unwrap()
            .then(() => toast.success('Plan switched!'))
            .catch(() => toast.error('Failed to switch plan.'));
        setSwitchingPlanId('');
    };

    // --- CALCULATIONS ---
    const calculateRoutineTotals = (meals) => {
        return meals.reduce((acc, m) => ({
            calories: acc.calories + (m.calories || 0),
            protein: acc.protein + (m.protein || 0),
            carbs: acc.carbs + (m.carbs || 0),
            fat: acc.fat + (m.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    };

    const routineTotals = calculateRoutineTotals(routineMeals);

    // Maintenance tracking against completed totals
    const totalDailyCalories = dailyLog?.totalCalories || 0;
    const maintenanceDiff = totalDailyCalories - (user?.maintenanceCalories || 0);
    const progressPercentage = user?.maintenanceCalories > 0
        ? Math.min(100, (totalDailyCalories / user.maintenanceCalories) * 100)
        : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative z-10 w-full pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-500/20 rounded-xl">
                        <Apple className="w-8 h-8 text-rose-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Diet Plans</h1>
                        <p className="text-slate-400">Build plans and check off daily meals.</p>
                    </div>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('log')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'log' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <CheckCircle2 className="w-4 h-4" /> Daily Checklist
                    </button>
                    <button
                        onClick={() => setActiveTab('routines')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'routines' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Save className="w-4 h-4" /> Diet Plans
                    </button>
                </div>
            </div>

            {/* MAINTENANCE CALORIES BANNER */}
            <div className="bg-slate-800/80 backdrop-blur-xl border border-rose-500/30 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />

                <div className="flex-1 relative z-10">
                    <h2 className="text-lg font-bold text-white mb-1">Daily Maintenance Calories</h2>
                    <p className="text-sm text-slate-400 max-w-md">Your baseline caloric needs. Use this to monitor your absolute surplus or deficit against your checked off meals.</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-2 pl-6 rounded-xl border border-slate-700/50 relative z-10">
                    {isEditingMaintenance ? (
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={maintenanceInput}
                                    onChange={(e) => setMaintenanceInput(e.target.value)}
                                    className="w-24 bg-transparent text-2xl font-bold text-rose-400 outline-none text-right border-b border-rose-500/50 pb-1"
                                />
                                <span className="text-sm text-slate-500 mr-2">kcal</span>
                                <button
                                    onClick={handleSaveMaintenance}
                                    className="p-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-white transition-colors"
                                    title="Save"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingMaintenance(false);
                                        setShowCalculator(false);
                                    }}
                                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowCalculator(!showCalculator)}
                                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors underline"
                            >
                                {showCalculator ? "Hide Calculator" : "Use Calculator"}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-rose-400">{user?.maintenanceCalories || 0}</span>
                                <span className="text-sm text-slate-500">kcal</span>
                            </div>
                            <button
                                onClick={() => setIsEditingMaintenance(true)}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors ml-2"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* CALCULATOR EXPANDABLE SECTION */}
            <AnimatePresence>
                {isEditingMaintenance && showCalculator && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl overflow-hidden"
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Calculate Target Calories</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-rose-500 text-sm appearance-none"
                                        value={calcGender}
                                        onChange={(e) => setCalcGender(e.target.value)}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-rose-500 text-sm"
                                    value={calcWeight}
                                    onChange={(e) => setCalcWeight(e.target.value)}
                                    placeholder="e.g. 75"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-rose-500 text-sm"
                                    value={calcHeight}
                                    onChange={(e) => setCalcHeight(e.target.value)}
                                    placeholder="e.g. 180"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Age</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-rose-500 text-sm"
                                    value={calcAge}
                                    onChange={(e) => setCalcAge(e.target.value)}
                                    placeholder="e.g. 25"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Activity Level</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-rose-500 text-sm appearance-none"
                                        value={calcActivity}
                                        onChange={(e) => setCalcActivity(e.target.value)}
                                    >
                                        <option value="1.2">Sedentary (Little/No Exercise)</option>
                                        <option value="1.375">Lightly Active (1-3 days/week)</option>
                                        <option value="1.55">Moderately Active (3-5 days/week)</option>
                                        <option value="1.725">Very Active (6-7 days/week)</option>
                                        <option value="1.9">Extra Active (Labor job/2x day)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleCalculateBMR}
                                disabled={!calcWeight || !calcHeight || !calcAge}
                                className="px-6 py-2 bg-rose-500 hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                                Calculate & Apply
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {activeTab === 'log' ? (
                    <motion.div
                        key="log"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8" // Removed grid to stack checklist centrally
                    >
                        {/* CHECKLIST OR START PROMPT */}
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
                        ) : dailyLog ? (
                            /* ACTIVE CHECKLIST */
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left: Tracker Ring */}
                                <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                                    <button 
                                        onClick={() => setDeletingDailyLog(true)}
                                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
                                        title="Reset Day's Plan"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    <AnimatePresence>
                                        {deletingDailyLog && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 z-20 p-6">
                                                <p className="text-white font-bold text-lg text-center">Clear today's plan?</p>
                                                <p className="text-slate-400 text-sm text-center">This will reset all checked meals for today.</p>
                                                <div className="flex gap-3 w-full max-w-xs">
                                                    <button onClick={() => setDeletingDailyLog(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors text-sm">Cancel</button>
                                                    <button onClick={() => { dispatch(deleteDailyDiet(dailyLog._id)).unwrap().then(() => { toast.success('Day cleared.'); setDeletingDailyLog(false); }).catch(() => toast.error('Failed to clear.')); }} className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 rounded-xl text-white font-bold transition-colors text-sm">Clear Day</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <div className="mb-8 w-full px-8 text-center relative z-10 group">
                                        <div className="relative inline-block w-full max-w-sm mx-auto">
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700/50 hover:border-rose-500/50 transition-colors rounded-xl text-white font-bold text-lg text-center cursor-pointer outline-none py-3 px-4 shadow-inner appearance-none"
                                                value=""
                                                onChange={handleChangeDailyPlan}
                                            >
                                                <option value="" disabled>{dailyLog.routineName}</option>
                                                {dietRoutines.map(r => (
                                                    r.name !== dailyLog.routineName && (
                                                        <option key={r._id} value={r._id}>Switch to: {r.name}</option>
                                                    )
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none group-hover:text-rose-400 transition-colors" />
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-semibold">Daily Plan Recap</div>
                                    </div>

                                    <AnimatePresence>
                                        {switchingPlanId && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center mb-4 z-10 relative">
                                                <p className="text-amber-300 font-semibold text-sm mb-3">Switch plan? Checked-off meals with matching names will be kept.</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setSwitchingPlanId('')} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium transition-colors">Cancel</button>
                                                    <button onClick={confirmSwitchPlan} className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-white text-xs font-bold transition-colors">Confirm Switch</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Circle Progress */}
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="96" cy="96" r="88" className="stroke-slate-700 fill-none" strokeWidth="12" />
                                            <circle
                                                cx="96" cy="96" r="88"
                                                className="stroke-rose-500 fill-none transition-all duration-1000 ease-out"
                                                strokeWidth="12"
                                                strokeLinecap="round"
                                                strokeDasharray="553"
                                                strokeDashoffset={553 - (553 * progressPercentage) / 100}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <span className="text-4xl font-bold text-white">{totalDailyCalories}</span>
                                            <span className="text-sm text-slate-400">kcal eaten</span>
                                        </div>
                                    </div>

                                    {/* Surplus/Deficit Indicator */}
                                    {user?.maintenanceCalories > 0 && (
                                        <div className={`mt-8 w-full p-4 rounded-xl flex flex-col items-center justify-center gap-1 font-bold ${maintenanceDiff > 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : maintenanceDiff < 0 ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-700/30 text-slate-300'}`}>
                                            {maintenanceDiff > 0 ? (
                                                <><TrendingUp className="w-5 h-5 mb-1" /> Surplus: +{maintenanceDiff} kcal</>
                                            ) : maintenanceDiff < 0 ? (
                                                <><TrendingDown className="w-5 h-5 mb-1" /> Deficit: {Math.abs(maintenanceDiff)} kcal</>
                                            ) : (
                                                <><Minus className="w-5 h-5 mb-1" /> Perfect Maintenance</>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center border-t border-slate-700/50 pt-6">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Protein</p>
                                            <p className="font-mono text-white">{dailyLog.totalProtein}g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Carbs</p>
                                            <p className="font-mono text-white">{dailyLog.totalCarbs}g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Fat</p>
                                            <p className="font-mono text-white">{dailyLog.totalFat}g</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: The Checklist */}
                                <div className="lg:col-span-2 bg-slate-800/20 rounded-2xl space-y-4 relative">
                                    <h3 className="text-xl font-bold text-white px-2">Meals</h3>
                                    {dailyLog.meals?.length > 0 ? (
                                        dailyLog.meals.map((meal, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleToggleMeal(idx)}
                                            className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${meal.completed ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="flex-shrink-0">
                                                    {meal.completed ? (
                                                        <CheckCircle className="w-8 h-8 text-rose-500" />
                                                    ) : (
                                                        <Circle className="w-8 h-8 text-slate-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className={`text-lg font-bold transition-colors ${meal.completed ? 'text-white' : 'text-slate-300'}`}>{meal.name}</h4>
                                                    <div className="flex gap-4 mt-2 text-sm font-mono text-slate-500">
                                                        <span>P:{meal.protein}</span>
                                                        <span>C:{meal.carbs}</span>
                                                        <span>F:{meal.fat}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`text-xl font-bold font-mono transition-colors ${meal.completed ? 'text-rose-400' : 'text-slate-500'}`}>
                                                {meal.calories} kcal
                                            </div>
                                        </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed mt-4">
                                            <p className="text-slate-400 mb-2">This plan has no meals.</p>
                                            <p className="text-sm text-slate-500">Use the trash icon in the recap card to clear the day and select another plan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* START PROMPT (EMPTY STATE) */
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl text-center max-w-2xl mx-auto mt-12 shadow-2xl">
                                <Apple className="w-16 h-16 text-slate-600 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2">No Plan Active</h3>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto">Select a diet plan template to generate your daily checklist and start tracking your meals.</p>

                                <form onSubmit={handleStartDay} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                    <div className="relative flex-1">
                                        <select
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500 appearance-none text-left"
                                            value={selectedRoutineToStart}
                                            onChange={(e) => setSelectedRoutineToStart(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Select a Plan...</option>
                                            {dietRoutines.map(r => (
                                                <option key={r._id} value={r._id}>{r.name} ({r.targetCalories} kcal)</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!selectedRoutineToStart || isLoading}
                                        className="px-6 py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all whitespace-nowrap"
                                    >
                                        Start Checking
                                    </button>
                                </form>
                                {dietRoutines.length === 0 && (
                                    <p className="mt-4 text-sm text-amber-500">You don't have any Diet Plans yet. Go to the Diet Plans tab to create one first!</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="routines"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        {/* PLAN BUILDER */}
                        {isBuildingRoutine ? (
                            <div className="bg-slate-800/80 backdrop-blur-xl border border-rose-500/30 p-6 sm:p-8 rounded-2xl shadow-2xl animate-fade-in relative max-w-3xl mx-auto">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    {editingRoutineId ? <Edit2 className="w-6 h-6 text-rose-400" /> : <Plus className="w-6 h-6 text-rose-400" />}
                                    {editingRoutineId ? 'Edit Diet Plan' : 'Create New Diet Plan'}
                                </h2>

                                <form onSubmit={handleSaveRoutine} className="space-y-8">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Plan Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Cut Day, Maintenance Fast..."
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500 text-lg font-bold"
                                            value={routineName}
                                            onChange={(e) => setRoutineName(e.target.value)}
                                        />
                                    </div>

                                    {/* Meals List */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
                                            <h3 className="text-lg font-bold text-white">Meals</h3>
                                            <button
                                                type="button"
                                                onClick={handleAddMealToRoutine}
                                                className="text-sm font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Plus className="w-4 h-4" /> Add Meal
                                            </button>
                                        </div>

                                        {routineMeals.length === 0 ? (
                                            <p className="text-center text-slate-500 py-8 italic bg-slate-900/50 rounded-xl border border-dashed border-slate-700">No meals added yet. Add a meal to populate your checklist.</p>
                                        ) : (
                                            routineMeals.map((meal, idx) => (
                                                <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 relative animate-fade-in group">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRoutineMeal(idx)}
                                                        className="absolute -right-3 -top-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                        <div className="md:col-span-12">
                                                            <input
                                                                type="text" required placeholder="Meal Name (e.g. Breakfast, Lunch, Snack)"
                                                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-rose-500"
                                                                value={meal.name}
                                                                onChange={(e) => handleUpdateRoutineMeal(idx, 'name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Calories</label>
                                                            <input type="number" required className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-400 font-bold text-sm outline-none focus:border-rose-500" value={meal.calories} onChange={(e) => handleUpdateRoutineMeal(idx, 'calories', e.target.value)} />
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Protein (g)</label>
                                                            <input type="number" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-rose-500" value={meal.protein} onChange={(e) => handleUpdateRoutineMeal(idx, 'protein', e.target.value)} />
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Carbs (g)</label>
                                                            <input type="number" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-rose-500" value={meal.carbs} onChange={(e) => handleUpdateRoutineMeal(idx, 'carbs', e.target.value)} />
                                                        </div>
                                                        <div className="md:col-span-3">
                                                            <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Fat (g)</label>
                                                            <input type="number" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-rose-500" value={meal.fat} onChange={(e) => handleUpdateRoutineMeal(idx, 'fat', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Auto-Calculated Totals */}
                                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 flex justify-between items-center text-center">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Plan Calories</p>
                                            <p className="text-2xl font-bold text-rose-400">{routineTotals.calories}</p>
                                        </div>
                                        <div className="flex gap-6 opacity-70">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase">Protein</p>
                                                <p className="font-mono text-white text-sm">{routineTotals.protein}g</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase">Carbs</p>
                                                <p className="font-mono text-white text-sm">{routineTotals.carbs}g</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase">Fat</p>
                                                <p className="font-mono text-white text-sm">{routineTotals.fat}g</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-slate-700/50">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsBuildingRoutine(false);
                                                setEditingRoutineId(null);
                                                setRoutineName('');
                                                setRoutineMeals([]);
                                            }}
                                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={routineMeals.length === 0}
                                            className="flex-1 px-6 py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                                        >
                                            <Save className="w-5 h-5" /> {editingRoutineId ? 'Update Plan' : 'Save Plan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsBuildingRoutine(true)}
                                    className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Create New Plan
                                </button>
                            </div>
                        )}

                        {/* PLAN LIST */}
                        {!isBuildingRoutine && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dietRoutines.length > 0 ? dietRoutines.map((routine) => (
                                    <React.Fragment key={routine._id}>
                                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl flex flex-col justify-between hover:border-rose-500/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex flex-col">
                                                <h3 className="font-bold text-white text-xl leading-tight mb-1">{routine.name}</h3>
                                                <span className="text-xs text-slate-400">{routine.meals?.length || 0} Meals Structured</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => editRoutine(routine)}
                                                    className="p-2 bg-slate-700/50 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingRoutineId(routine._id)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/30 text-center">
                                            <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Target</p>
                                            <p className="text-rose-400 font-bold text-3xl">{routine.targetCalories} <span className="text-base font-normal text-slate-500">kcal</span></p>
                                        </div>

                                        <div className="flex justify-between text-center border-t border-slate-700/50 pt-4 font-mono text-sm">
                                            <div className="flex-1">
                                                <span className="block text-slate-500 text-xs">P</span>
                                                <span className="text-white">{routine.targetProtein}g</span>
                                            </div>
                                            <div className="flex-1 border-x border-slate-700/50">
                                                <span className="block text-slate-500 text-xs">C</span>
                                                <span className="text-white">{routine.targetCarbs}g</span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="block text-slate-500 text-xs">F</span>
                                                <span className="text-white">{routine.targetFat}g</span>
                                            </div>
                                        </div>
                                        </div>

                                        {deletingRoutineId === routine._id && (
                                            <div className="mt-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                                                <p className="text-white text-sm font-semibold mb-1">Delete {'"'}{routine.name}{'"'}?</p>
                                                <p className="text-slate-400 text-xs mb-3">This will permanently remove this plan template.</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setDeletingRoutineId(null)} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium transition-colors">Cancel</button>
                                                    <button onClick={() => { dispatch(deleteDietRoutine(routine._id)).unwrap().then(() => { toast.success('Plan deleted.'); setDeletingRoutineId(null); }).catch(() => toast.error('Failed to delete.')); }} className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-400 rounded-lg text-white text-xs font-bold transition-colors">Delete</button>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/30 border-dashed">
                                        <Apple className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <h3 className="text-xl font-bold text-white mb-2">No Plans Yet</h3>
                                        <p className="text-slate-400 max-w-sm mx-auto">Create a diet plan (like "Bulking Day") and list your meals. You'll apply these plans to your daily checklist.</p>
                                        <button
                                            onClick={() => setIsBuildingRoutine(true)}
                                            className="mt-6 px-6 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Create First Plan
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DietTracker;
