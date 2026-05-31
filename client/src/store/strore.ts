import chatReducer from "../features/chatSlice";
import soundPreferenceReducer from "../features/soundSlice";
import userReducer from "../features/userSlice";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    soundPreference: soundPreferenceReducer,
    chat: chatReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
