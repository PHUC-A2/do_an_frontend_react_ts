import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import accountReducer from './features/accountSlice'
import userReducer from './features/userSlice'
import pitchReducer from './features/pitchSlice'
import bookingReducer from './features/bookingSlice'
import bookingUiReducer from './features/bookingUiSlice'
import bookingClientReducer from './features/bookingClientSlice'
import roleReducer from './features/roleSlice'
import permissionReducer from './features/permissionSlice'
import messengerButtonUiReducer from './features/messengerButtonUiSlice'
import paymentReducer from './features/paymentSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer, // authReducer là tên có thể đặt tùy ý
        account: accountReducer,
        user: userReducer,
        pitch: pitchReducer,
        booking: bookingReducer,
        bookingClient: bookingClientReducer,
        bookingUi: bookingUiReducer,
        role: roleReducer,
        permission: permissionReducer,
        messengerButtonUi: messengerButtonUiReducer,
        payment: paymentReducer,
    }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store