import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ChartData = any;

interface WorkflowState {
  currentChartData: ChartData | null;
}

const initialState: WorkflowState = {
  currentChartData: null,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setCurrentChartData(state, action: PayloadAction<ChartData | null>) {
      state.currentChartData = action.payload;
    },
    clearCurrentChartData(state) {
      state.currentChartData = null;
    },
  },
});

export const { setCurrentChartData, clearCurrentChartData } = workflowSlice.actions;

export default workflowSlice.reducer;
