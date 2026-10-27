/**
 * Duyar Production Launch Storage Sanitizer
 * Ensures all legacy mock data, test tickets, dummy shipments, and seed visits
 * from earlier development sessions are completely removed from localStorage.
 */

const LEGACY_KEYS_TO_PURGE = [
  'duyar_maintenance_tickets_v1',
  'duyar_maintenance_tickets_v2',
  'duyar_maintenance_tickets_v3',
  'duyar_maintenance_tickets_clean_v1',
  'duyar_pickdrop_active_request_v1',
  'duyar_pickdrop_active_request_v2',
  'duyar_pickdrop_active_request_v3',
  'duyar_pickdrop_history_v1',
  'duyar_pickdrop_history_v2',
  'duyar_pickdrop_history_v3',
  'duyar_scheduled_maintenance_visits_v1',
  'duyar_property_visits_v1',
  'duyar_property_visits_v2',
  'duyar_property_visits_v3',
  'duyar_property_reviews_v1',
  'duyar_property_reviews_v2',
  'duyar_property_reviews_v3',
  'duyar_payout_requests_v1',
  'duyar_monthly_expenditures_v1',
  'duyar_transactions_v1',
  'duyar_published_properties_v1',
  'duyar_published_properties_v2',
  'duyar_posted_properties_v1',
  'duyar_posted_properties_v2',
  'duyar_pending_deposits_v1',
  'duyar_pending_deposits_v2',
  'duyar_provider_applications_v1',
  'duyar_provider_applications_v2',
  'duyar_latest_posted_id',
  'duyar_search_alerts_v1',
  'duyar_inapp_notifications_v1',
  'duyar_sent_emails_v1'
];

export function sanitizeAppStorageForProduction(): void {
  if (typeof window === 'undefined') return;
  try {
    const hasSanitized = localStorage.getItem('duyar_fresh_live_launch_v1');
    if (!hasSanitized) {
      LEGACY_KEYS_TO_PURGE.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });
      localStorage.setItem('duyar_fresh_live_launch_v1', 'true');
    }
  } catch (err) {
    console.debug('Storage sanitizer notice:', err);
  }
}
