import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile, logout, reset } from '../store/authSlice';
import {
    User, Mail, Lock, Ruler, Weight, Flame, Target, Activity,
    Save, Edit2, LogOut, ShieldAlert, ChevronDown, Loader2,
    Calendar, TrendingUp, Dumbbell, Scale, Check, X, BarChart3, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSelector as useWeightSelector } from 'react-redux';

// ─── Constants ────────────────────────────────────────────────────────────────
const GOAL_OPTIONS = [
    { value: 'cut',      label: 'Cut',         desc: 'Lose body fat while preserving muscle',  color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/40' },
    { value: 'bulk',     label: 'Bulk',         desc: 'Build muscle mass with a caloric surplus', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40' },
    { value: 'maintain', label: 'Maintain',     desc: 'Stay at current weight and improve fitness', color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/40' },
    { value: 'recomp',   label: 'Recomposition',desc: 'Simultaneously lose fat and build muscle', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/40' },
];

const ACTIVITY_OPTIONS = [
    { value: '1.2',   label: 'Sedentary',          desc: 'Little or no exercise' },
    { value: '1.375', label: 'Lightly Active',      desc: '1–3 days/week' },
    { value: '1.55',  label: 'Moderately Active',   desc: '3–5 days/week' },
    { value: '1.725', label: 'Very Active',          desc: '6–7 days/week' },
    { value: '1.9',   label: 'Extra Active',         desc: 'Labor job / 2× daily' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children, accent = 'teal' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-xl bg-${accent}-500/10`}>
                <Icon className={`w-5 h-5 text-${accent}-400`} />
            </div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        {children}
    </motion.div>
);

const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
        {children}
    </div>
);

const Input = ({ icon: Icon, ...props }) => (
    <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />}
        <input
            className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm`}
            {...props}
        />
    </div>
);

const SaveBtn = ({ loading, dirty, onClick }) => (
    <AnimatePresence>
        {dirty && (
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={onClick}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-teal-500/25"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
            </motion.button>
        )}
    </AnimatePresence>
);

// ─── BMI Calculator helper ────────────────────────────────────────────────────
const calcBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) return null;
    const bmi = weightKg / ((heightCm / 100) ** 2);
    return bmi.toFixed(1);
};

const bmiCategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-sky-400' };
    if (bmi < 25)   return { label: 'Normal',       color: 'text-teal-400' };
    if (bmi < 30)   return { label: 'Overweight',   color: 'text-amber-400' };
    return             { label: 'Obese',            color: 'text-rose-400' };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading } = useSelector((state) => state.auth);
    const { workouts } = useSelector((state) => state.workout);
    const { weights } = useSelector((state) => state.weight);

    // ── Account section ──
    const [accountForm, setAccountForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [accountDirty, setAccountDirty] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // ── Body metrics section ──
    const [metricsForm, setMetricsForm] = useState({ height: '', currentWeight: '', bodyFat: '', age: '', gender: '' });
    const [metricsDirty, setMetricsDirty] = useState(false);

    // ── Goals section ──
    const [goalsForm, setGoalsForm] = useState({ fitnessGoal: '', targetWeight: '', activityLevel: '1.2', maintenanceCalories: 0 });
    const [goalsDirty, setGoalsDirty] = useState(false);

    // ── Danger zone ──
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Populate form from user state
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        setAccountForm({ name: user.name || '', email: user.email || '', password: '', confirmPassword: '' });
        setMetricsForm({
            height: user.height ?? '',
            currentWeight: user.currentWeight ?? '',
            bodyFat: user.bodyFat ?? '',
            age: user.age ?? '',
            gender: user.gender ?? '',
        });
        setGoalsForm({
            fitnessGoal: user.fitnessGoal ?? '',
            targetWeight: user.targetWeight ?? '',
            activityLevel: user.activityLevel ?? '1.2',
            maintenanceCalories: user.maintenanceCalories ?? 0,
        });
    }, [user, navigate]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleAccountChange = (e) => {
        setAccountForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setAccountDirty(true);
    };

    const saveAccount = () => {
        if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        if (accountForm.password && accountForm.password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        const payload = { name: accountForm.name, email: accountForm.email };
        if (accountForm.password) payload.password = accountForm.password;
        dispatch(updateProfile(payload))
            .unwrap()
            .then(() => {
                toast.success('Account updated!');
                setAccountDirty(false);
                setAccountForm(p => ({ ...p, password: '', confirmPassword: '' }));
                setShowPass(false);
            })
            .catch((err) => toast.error(err || 'Failed to update account.'));
    };

    const handleMetricsChange = (e) => {
        setMetricsForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setMetricsDirty(true);
    };

    const saveMetrics = () => {
        const payload = {
            height: metricsForm.height !== '' ? Number(metricsForm.height) : null,
            currentWeight: metricsForm.currentWeight !== '' ? Number(metricsForm.currentWeight) : null,
            bodyFat: metricsForm.bodyFat !== '' ? Number(metricsForm.bodyFat) : null,
            age: metricsForm.age !== '' ? Number(metricsForm.age) : null,
            gender: metricsForm.gender || null,
        };
        dispatch(updateProfile(payload))
            .unwrap()
            .then(() => { toast.success('Body metrics saved!'); setMetricsDirty(false); })
            .catch((err) => toast.error(err || 'Failed to save metrics.'));
    };

    const handleGoalsChange = (e) => {
        setGoalsForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setGoalsDirty(true);
    };

    const setGoal = (val) => {
        setGoalsForm(p => ({ ...p, fitnessGoal: val }));
        setGoalsDirty(true);
    };

    const saveGoals = () => {
        dispatch(updateProfile({
            fitnessGoal: goalsForm.fitnessGoal || null,
            targetWeight: goalsForm.targetWeight !== '' ? Number(goalsForm.targetWeight) : null,
            activityLevel: goalsForm.activityLevel,
            maintenanceCalories: Number(goalsForm.maintenanceCalories),
        }))
            .unwrap()
            .then(() => { toast.success('Goals & nutrition saved!'); setGoalsDirty(false); })
            .catch((err) => toast.error(err || 'Failed to save goals.'));
    };

    const handleLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    // ── Derived values ────────────────────────────────────────────────────
    const bmi = calcBMI(Number(metricsForm.currentWeight), Number(metricsForm.height));
    const bmiInfo = bmiCategory(Number(bmi));
    const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
    const activeGoal = GOAL_OPTIONS.find(g => g.value === (user?.fitnessGoal || goalsForm.fitnessGoal));

    // ── BMR quick calculator ──────────────────────────────────────────────
    const calcTDEE = () => {
        const w = Number(metricsForm.currentWeight);
        const h = Number(metricsForm.height);
        const a = Number(metricsForm.age);
        const g = metricsForm.gender;
        if (!w || !h || !a || !g || g === 'other') {
            toast.error('Fill in weight, height, age, and gender in Body Metrics first.');
            return;
        }
        let bmr = g === 'male'
            ? (10 * w) + (6.25 * h) - (5 * a) + 5
            : (10 * w) + (6.25 * h) - (5 * a) - 161;
        const tdee = Math.round(bmr * Number(goalsForm.activityLevel));
        setGoalsForm(p => ({ ...p, maintenanceCalories: tdee }));
        setGoalsDirty(true);
        toast.success(`Calculated TDEE: ${tdee} kcal`);
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 relative z-10 animate-fade-in">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-accent flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-teal-500/20">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" /> Member since {memberSince}
                            {activeGoal && (
                                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-bold border ${activeGoal.bg} ${activeGoal.border} ${activeGoal.color}`}>
                                    {activeGoal.label}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Quick stats strip */}
                <div className="flex gap-4">
                    {[
                        { label: 'Workouts', value: workouts?.length ?? '—', icon: Dumbbell },
                        { label: 'Weigh-ins', value: weights?.length ?? '—', icon: Scale },
                        { label: 'Kcal Target', value: user.maintenanceCalories || '—', icon: Flame },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-xl text-center min-w-[72px]">
                            <Icon className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                            <p className="text-lg font-bold text-white">{value}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Account Info ────────────────────────────────────── */}
            <SectionCard title="Account Info" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Display Name">
                        <Input icon={User} name="name" value={accountForm.name} onChange={handleAccountChange} placeholder="Your name" />
                    </Field>
                    <Field label="Email Address">
                        <Input icon={Mail} name="email" type="email" value={accountForm.email} onChange={handleAccountChange} placeholder="you@example.com" />
                    </Field>
                </div>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        {showPass ? 'Hide Password Change' : 'Change Password'}
                    </button>
                    <AnimatePresence>
                        {showPass && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 overflow-hidden"
                            >
                                <Field label="New Password">
                                    <Input icon={Lock} name="password" type="password" value={accountForm.password} onChange={handleAccountChange} placeholder="Min 6 characters" autoComplete="new-password" />
                                </Field>
                                <Field label="Confirm Password">
                                    <Input icon={Lock} name="confirmPassword" type="password" value={accountForm.confirmPassword} onChange={handleAccountChange} placeholder="Repeat password" autoComplete="new-password" />
                                </Field>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-6 flex justify-end">
                    <SaveBtn loading={isLoading} dirty={accountDirty} onClick={saveAccount} />
                </div>
            </SectionCard>

            {/* ── Body Metrics ─────────────────────────────────────── */}
            <SectionCard title="Body Metrics" icon={Ruler} accent="violet">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <Field label="Height (cm)">
                        <Input icon={Ruler} name="height" type="number" value={metricsForm.height} onChange={handleMetricsChange} placeholder="e.g. 178" />
                    </Field>
                    <Field label="Weight (kg)">
                        <Input icon={Weight} name="currentWeight" type="number" value={metricsForm.currentWeight} onChange={handleMetricsChange} placeholder="e.g. 75" />
                    </Field>
                    <Field label="Body Fat (%)">
                        <Input icon={Percent} name="bodyFat" type="number" value={metricsForm.bodyFat} onChange={handleMetricsChange} placeholder="e.g. 18" />
                    </Field>
                    <Field label="Age">
                        <Input icon={Calendar} name="age" type="number" value={metricsForm.age} onChange={handleMetricsChange} placeholder="e.g. 25" />
                    </Field>
                    <Field label="Gender">
                        <div className="relative">
                            <select
                                name="gender"
                                value={metricsForm.gender}
                                onChange={handleMetricsChange}
                                className="w-full pl-4 pr-8 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white outline-none focus:border-violet-500 transition-all text-sm appearance-none"
                            >
                                <option value="">Select…</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </Field>
                </div>

                {/* BMI Display */}
                {bmi && (
                    <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-700/30 rounded-xl p-4 mb-6">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">BMI</p>
                            <p className={`text-3xl font-black ${bmiInfo?.color ?? 'text-white'}`}>{bmi}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-700" />
                        <div>
                            <p className={`font-bold text-base ${bmiInfo?.color ?? 'text-white'}`}>{bmiInfo?.label}</p>
                            <p className="text-slate-500 text-xs mt-0.5">Based on your current height & weight</p>
                        </div>
                        {/* Mini progress bar */}
                        <div className="flex-1 ml-4">
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${Number(bmi) < 18.5 ? 'bg-sky-400' : Number(bmi) < 25 ? 'bg-teal-400' : Number(bmi) < 30 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.min(100, (Number(bmi) / 40) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                <span>18.5</span><span>25</span><span>30</span><span>40</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <SaveBtn loading={isLoading} dirty={metricsDirty} onClick={saveMetrics} />
                </div>
            </SectionCard>

            {/* ── Fitness Goals & Nutrition ─────────────────────────── */}
            <SectionCard title="Fitness Goal & Nutrition" icon={Target} accent="rose">

                {/* Goal Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {GOAL_OPTIONS.map(g => (
                        <button
                            key={g.value}
                            type="button"
                            onClick={() => setGoal(g.value)}
                            className={`p-4 rounded-xl border text-left transition-all ${goalsForm.fitnessGoal === g.value
                                ? `${g.bg} ${g.border} shadow-lg`
                                : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className={`font-bold text-sm ${goalsForm.fitnessGoal === g.value ? g.color : 'text-white'}`}>{g.label}</p>
                                {goalsForm.fitnessGoal === g.value && <Check className={`w-4 h-4 ${g.color}`} />}
                            </div>
                            <p className="text-xs text-slate-400 leading-tight">{g.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Field label="Target Weight (kg)">
                        <Input icon={TrendingUp} name="targetWeight" type="number" value={goalsForm.targetWeight} onChange={handleGoalsChange} placeholder="e.g. 72" />
                    </Field>

                    <Field label="Activity Level">
                        <div className="relative">
                            <select
                                name="activityLevel"
                                value={goalsForm.activityLevel}
                                onChange={handleGoalsChange}
                                className="w-full pl-4 pr-8 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500 transition-all text-sm appearance-none"
                            >
                                {ACTIVITY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </Field>

                    <Field label="Maintenance Calories (kcal)">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="number"
                                    name="maintenanceCalories"
                                    value={goalsForm.maintenanceCalories}
                                    onChange={handleGoalsChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500 transition-all text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={calcTDEE}
                                className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold transition-colors whitespace-nowrap"
                                title="Auto-calculate from Body Metrics"
                            >
                                Auto
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Click Auto to calculate from your body metrics</p>
                    </Field>
                </div>

                <div className="flex justify-end">
                    <SaveBtn loading={isLoading} dirty={goalsDirty} onClick={saveGoals} />
                </div>
            </SectionCard>

            {/* ── App Stats ────────────────────────────────────────── */}
            <SectionCard title="Your Stats" icon={BarChart3} accent="teal">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Workouts', value: workouts?.length ?? 0, icon: Dumbbell, color: 'text-accent' },
                        { label: 'Weight Entries', value: weights?.length ?? 0, icon: Scale, color: 'text-teal-400' },
                        { label: 'Maintenance kcal', value: user.maintenanceCalories || 0, icon: Flame, color: 'text-rose-400' },
                        { label: 'BMI', value: bmi ? calcBMI(Number(metricsForm.currentWeight), Number(metricsForm.height)) : '—', icon: Activity, color: bmiInfo?.color ?? 'text-slate-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 text-center">
                            <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                            <p className={`text-2xl font-black ${color}`}>{value}</p>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{label}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* ── Danger Zone ──────────────────────────────────────── */}
            <SectionCard title="Danger Zone" icon={ShieldAlert} accent="rose">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-white font-semibold">Sign out of PhysiqueLab</p>
                        <p className="text-slate-400 text-sm mt-0.5">You'll be redirected to the landing page and will need to log back in.</p>
                    </div>
                    <AnimatePresence mode="wait">
                        {showLogoutConfirm ? (
                            <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-2 flex-shrink-0">
                                <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button onClick={handleLogout} className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1">
                                    <LogOut className="w-4 h-4" /> Yes, Sign Out
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setShowLogoutConfirm(true)}
                                className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </SectionCard>
        </div>
    );
};

export default Profile;
