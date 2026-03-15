import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getWeights, createWeight, updateWeight, deleteWeight, reset } from '../store/weightSlice';
import { Scale, Plus, Loader2, TrendingDown, TrendingUp, Minus, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'react-hot-toast';

const WeightTracker = () => {
    // Utility to get YYYY-MM-DD in the local timezone reliably
    const getLocalYMD = (dateString) => {
        const d = dateString ? new Date(dateString) : new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(() => getLocalYMD());

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editWeight, setEditWeight] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editDate, setEditDate] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState(null);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { weights, analytics, isLoading, isError, message, isSuccess } = useSelector(
        (state) => state.weight
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
        dispatch(getWeights());
        return () => { dispatch(reset()); };
    }, [user, navigate, dispatch]);

    // Chart data - reversed for chronological order
    const chartData = useMemo(() => {
        if (!weights || weights.length < 2) return [];
        return [...weights].slice(0, 15).reverse().map(w => ({
            date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            weight: w.weight,
        }));
    }, [weights]);

    const onSubmit = (e) => {
        e.preventDefault();
        const todayStr = getLocalYMD();
        let finalDate;

        if (date === todayStr) {
            finalDate = new Date().toISOString();
        } else {
            const [y, m, d] = date.split('-');
            finalDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();
        }

        dispatch(createWeight({ weight: Number(weight), notes, date: finalDate }))
            .unwrap()
            .then(() => {
                toast.success('Weight logged successfully!');
                setWeight('');
                setNotes('');
                setDate(todayStr);
            })
            .catch((err) => toast.error(err || 'Failed to log weight.'));
    };

    const startEdit = (entry) => {
        setEditingId(entry._id);
        setEditWeight(entry.weight);
        setEditDate(getLocalYMD(entry.date));
        setEditNotes(entry.notes || '');
    };

    const cancelEdit = () => { setEditingId(null); };

    const onUpdate = (e, id) => {
        e.preventDefault();
        const originalEntry = weights.find(w => w._id === id);
        const originalDateStr = getLocalYMD(originalEntry.date);
        const todayStr = getLocalYMD();

        let finalDate;
        if (editDate === originalDateStr) {
            finalDate = originalEntry.date;
        } else if (editDate === todayStr) {
            finalDate = new Date().toISOString();
        } else {
            const [y, m, d] = editDate.split('-');
            finalDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();
        }

        dispatch(updateWeight({ id, weightData: { weight: Number(editWeight), date: finalDate, notes: editNotes } }))
            .unwrap()
            .then(() => {
                toast.success('Entry updated!');
                setEditingId(null);
            })
            .catch((err) => toast.error(err || 'Failed to update.'));
    };

    const onDelete = (id) => {
        dispatch(deleteWeight(id))
            .unwrap()
            .then(() => {
                toast.success('Entry deleted.');
                setDeletingId(null);
            })
            .catch((err) => toast.error(err || 'Failed to delete.'));
    };

    const TrendIcon = ({ value }) => {
        if (value < 0) return <TrendingDown className="w-4 h-4 text-emerald-400" />;
        if (value > 0) return <TrendingUp className="w-4 h-4 text-rose-400" />;
        return <Minus className="w-4 h-4 text-slate-400" />;
    };

    const TrendColor = ({ value, children }) => {
        if (value < 0) return <span className="text-emerald-400 font-bold">{children}</span>;
        if (value > 0) return <span className="text-rose-400 font-bold">{children}</span>;
        return <span className="text-slate-400 font-bold">{children}</span>;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative z-10 w-full">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-2xl border border-blue-500/20">
                    <Scale className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Weight Tracker</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Monitor your weight journey over time</p>
                </div>
            </motion.div>

            {/* Analytics Snapshot */}
            {weights.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: '24h Change', value: analytics?.dailyChange },
                        { label: '7-Day Change', value: analytics?.weeklyChange },
                        { label: '30-Day Change', value: analytics?.monthlyChange },
                    ].map((item) => (
                        <div key={item.label} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{item.label}</p>
                            <div className="flex items-center gap-2">
                                <TrendIcon value={item.value} />
                                <TrendColor value={item.value}>{item.value > 0 ? '+' : ''}{item.value || 0} kg</TrendColor>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Weight Graph */}
            {chartData.length > 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl">
                    <h2 className="text-lg font-bold text-white mb-6">Weight History</h2>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />
                                <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(1)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                />
                                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3.5} dot={{ r: 4, fill: '#1e293b', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-1">
                    <motion.form
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onSubmit={onSubmit}
                        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl sticky top-24"
                    >
                        <h2 className="text-xl font-bold text-white mb-5">Log Weight</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none transition-all"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    max={getLocalYMD()}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g. 75.5"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Notes <span className="text-slate-500 font-normal">(Optional)</span></label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white resize-none h-20 transition-all"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="How did you feel today?"
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] flex justify-center items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Add Entry</>}
                            </button>
                        </div>
                    </motion.form>
                </div>

                {/* History Section */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-white">Recent Entries</h2>
                    {weights.length > 0 ? (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {weights.map((entry, idx) => (
                                    editingId === entry._id ? (
                                        <motion.div
                                            key={`edit-${entry._id}`}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="bg-slate-800/80 backdrop-blur-xl border border-blue-500/50 p-5 rounded-2xl shadow-lg ring-1 ring-blue-500/30"
                                        >
                                            <form onSubmit={(e) => onUpdate(e, entry._id)} className="space-y-3">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <input type="date" className="w-full sm:w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors" value={editDate} onChange={e => setEditDate(e.target.value)} required max={getLocalYMD()} />
                                                    <input type="number" step="0.1" className="w-full sm:w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors" value={editWeight} onChange={e => setEditWeight(e.target.value)} required placeholder="Weight (kg)" />
                                                </div>
                                                <input type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes (Optional)" />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors flex items-center gap-1.5 text-sm font-medium"><X className="w-4 h-4" /> Cancel</button>
                                                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-white transition-colors flex items-center gap-1.5 text-sm font-medium">
                                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    ) : deletingId === entry._id ? (
                                        <motion.div
                                            key={`del-${entry._id}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-rose-500/10 border border-rose-500/40 p-5 rounded-2xl"
                                        >
                                            <p className="text-white font-semibold mb-1">Delete this entry?</p>
                                            <p className="text-slate-400 text-sm mb-4">{entry.weight} kg on {new Date(entry.date).toLocaleDateString()}</p>
                                            <div className="flex gap-3">
                                                <button onClick={() => setDeletingId(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors text-sm">Cancel</button>
                                                <button onClick={() => onDelete(entry._id)} className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 rounded-xl text-white font-bold transition-colors text-sm flex items-center justify-center gap-2">
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={entry._id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-blue-500/30 transition-colors group"
                                        >
                                            <div>
                                                <p className="text-2xl font-black text-white">{entry.weight} <span className="text-sm font-normal text-slate-400">kg</span></p>
                                                {entry.notes && <p className="text-slate-400 text-sm mt-1 italic">{entry.notes}</p>}
                                            </div>
                                            <div className="flex justify-between items-center sm:gap-4 border-t sm:border-t-0 border-slate-700/50 pt-3 sm:pt-0">
                                                <p className="text-blue-400 font-semibold text-sm">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(entry)} className="p-2 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeletingId(entry._id)} className="p-2 bg-slate-700/80 hover:bg-rose-500/80 text-slate-300 hover:text-white rounded-lg transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/30 border-dashed">
                            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 font-semibold">No weight entries yet.</p>
                            <p className="text-slate-500 text-sm mt-1">Start logging your weight to see your progress here.</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeightTracker;
