import { baseApi } from '@/store/api/baseApi';
import type { ApiSuccess, UpdateProfileDto, User } from '@contracts';

/** Users server state — current user profile + admin user list. */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<User, void>({
      query: () => '/users/me',
      transformResponse: (r: ApiSuccess<User>) => r.data,
      providesTags: [{ type: 'User', id: 'ME' }],
    }),
    updateMe: build.mutation<User, UpdateProfileDto>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      transformResponse: (r: ApiSuccess<User>) => r.data,
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery, useUpdateMeMutation } = usersApi;
