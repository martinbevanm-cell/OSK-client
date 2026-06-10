import { baseApi } from '@/store/api/baseApi';
import type { ApiSuccess, SiteSettings, SiteSettingsPatch } from '@contracts';

/**
 * Site-wide settings (theme / logo / contact). Single tag so any mutation
 * forces every consumer (footer, contact page, header logo, admin form)
 * to re-read.
 */
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSiteSettings: build.query<SiteSettings, void>({
      query: () => '/settings',
      transformResponse: (r: ApiSuccess<SiteSettings>) => r.data,
      providesTags: [{ type: 'SiteSettings', id: 'CURRENT' }],
    }),
    updateSiteSettings: build.mutation<SiteSettings, SiteSettingsPatch>({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<SiteSettings>) => r.data,
      invalidatesTags: [
        { type: 'SiteSettings', id: 'CURRENT' },
        { type: 'AuditLog', id: 'FEED' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } = settingsApi;
