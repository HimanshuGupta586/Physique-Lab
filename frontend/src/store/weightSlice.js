import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    weights: [],
    analytics: {
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0
    },
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Get user weights & analytics
export const getWeights = createAsyncThunk('weights/getAll', async (_, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/weights', config);
        // Response is now { logs: [], analytics: {} }
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create new weight log
export const createWeight = createAsyncThunk('weights/create', async (weightData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post('/api/weights', weightData, config);
        // Response is { log: {}, analytics: {} }
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update weight log
export const updateWeight = createAsyncThunk('weights/update', async ({ id, weightData }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`/api/weights/${id}`, weightData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete weight log
export const deleteWeight = createAsyncThunk('weights/delete', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.delete(`/api/weights/${id}`, config);
        return response.data; // { id, analytics }
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const weightSlice = createSlice({
    name: 'weight',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getWeights.pending, (state) => { state.isLoading = true; })
            .addCase(getWeights.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.weights = action.payload.logs;
                state.analytics = action.payload.analytics;
            })
            .addCase(getWeights.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createWeight.pending, (state) => { state.isLoading = true; })
            .addCase(createWeight.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.weights.unshift(action.payload.log); // Add to top
                state.analytics = action.payload.analytics; // Update analytics
            })
            .addCase(createWeight.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateWeight.pending, (state) => { state.isLoading = true; })
            .addCase(updateWeight.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Replace the updated log in the array
                state.weights = state.weights.map((w) => w._id === action.payload.log._id ? action.payload.log : w);
                // Also sort by date just in case date was updated
                state.weights.sort((a, b) => new Date(b.date) - new Date(a.date));
                state.analytics = action.payload.analytics;
            })
            .addCase(updateWeight.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteWeight.pending, (state) => { state.isLoading = true; })
            .addCase(deleteWeight.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.weights = state.weights.filter((w) => w._id !== action.payload.id);
                state.analytics = action.payload.analytics;
            })
            .addCase(deleteWeight.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = weightSlice.actions;
export default weightSlice.reducer;
