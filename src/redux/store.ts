import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import accountReducer from './features/accountSlice'
export const store = configureStore({
    reducer: {
        auth: authReducer, // authReducer là tên có thể đặt tùy ý
        account: accountReducer,
    }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store