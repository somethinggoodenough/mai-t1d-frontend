import { configureStore } from '@reduxjs/toolkit';

import aiAgentReducer from './aiAgentSlice';
import aiAnswerReducer from './aiAnswerSlice';
import feedbackReducer from './feedbackSlice';
import uiReducer from './uiSlice';

const store = configureStore({
    reducer: {
        aiAgent: aiAgentReducer,
        aiAnswer: aiAnswerReducer,
        feedback: feedbackReducer,
        ui: uiReducer,
    },
});

export { store };
