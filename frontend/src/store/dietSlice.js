import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get daily diet checklist by date
export const getDailyDiet = createAsyncThunk('diet/getDaily', async (date, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`/api/diet/daily?date=${date}`, config);
        return response.data; // Note: Can be null if day not started
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create daily diet checklist from a routine
export const createDailyDiet = createAsyncThunk('diet/createDaily', async (data, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post('/api/diet/daily', data, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Toggle meal completion
export const toggleMealCompletion = createAsyncThunk('diet/toggleMeal', async ({ logId, mealIndex }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`/api/diet/daily/${logId}/meal/${mealIndex}`, {}, config);
        return response.data; // Returns the fully updated daily log
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete daily diet checklist
export const deleteDailyDiet = createAsyncThunk('diet/deleteDaily', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`/api/diet/daily/${id}`, config);
        return id;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Change daily diet routine without losing progress
export const changeDailyDietRoutine = createAsyncThunk('diet/changeDailyRoutine', async ({ logId, routineId }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`/api/diet/daily/${logId}/routine`, { routineId }, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get user diet routines
export const getDietRoutines = createAsyncThunk('diet/getRoutines', async (_, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/diet/routines', config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create diet routine
export const createDietRoutine = createAsyncThunk('diet/createRoutine', async (routineData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post('/api/diet/routines', routineData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update diet routine
export const updateDietRoutine = createAsyncThunk('diet/updateRoutine', async (routineData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`/api/diet/routines/${routineData._id}`, routineData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete diet routine
export const deleteDietRoutine = createAsyncThunk('diet/deleteRoutine', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`/api/diet/routines/${id}`, config);
        return id;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});


export const dietSlice = createSlice({
    name: 'diet',
    initialState: {
        dailyLog: null, // The checklist for the currently selected date
        dietRoutines: [],
        isError: false,
        isSuccess: false,
        isLoading: false,
        message: '',
    },
    reducers: {
        reset: (state) => {
            state.isError = false;
            state.isSuccess = false;
            state.isLoading = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Daily Checklist Actions
            .addCase(getDailyDiet.pending, (state) => { state.isLoading = true; })
            .addCase(getDailyDiet.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.dailyLog = action.payload; // can be null if empty
            })
            .addCase(getDailyDiet.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createDailyDiet.pending, (state) => { state.isLoading = true; })
            .addCase(createDailyDiet.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.dailyLog = action.payload; // sets the new day active
            })
            .addCase(createDailyDiet.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(toggleMealCompletion.fulfilled, (state, action) => {
                state.dailyLog = action.payload; // full replacement of totals + array toggle
            })
            .addCase(deleteDailyDiet.fulfilled, (state, action) => {
                state.dailyLog = null;
            })
            .addCase(changeDailyDietRoutine.fulfilled, (state, action) => {
                state.dailyLog = action.payload; // updates with new meals and recalculated totals
            })
            // Diet Routines Actions
            .addCase(getDietRoutines.pending, (state) => { state.isLoading = true; })
            .addCase(getDietRoutines.fulfilled, (state, action) => {
                state.isLoading = false;
                state.dietRoutines = action.payload;
            })
            .addCase(getDietRoutines.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createDietRoutine.pending, (state) => { state.isLoading = true; })
            .addCase(createDietRoutine.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.dietRoutines.unshift(action.payload);
            })
            .addCase(createDietRoutine.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateDietRoutine.fulfilled, (state, action) => {
                const index = state.dietRoutines.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.dietRoutines[index] = action.payload;
                }
            })
            .addCase(deleteDietRoutine.fulfilled, (state, action) => {
                state.dietRoutines = state.dietRoutines.filter(r => r._id !== action.payload);
            });
    },
});

export const { reset } = dietSlice.actions;
export default dietSlice.reducer;
