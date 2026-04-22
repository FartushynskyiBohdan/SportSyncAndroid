import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  deleteAdminUser,
  getAdminOverview,
  getAdminReportContext,
  getAdminReports,
  getAdminUsers,
  moderateAdminReport,
  updateAdminReportStatus,
  updateAdminUserRole,
} from '../../api/appApi';
import { buildMediaUrl } from '../../api/client';
import { AdminOverview, AdminReport, AdminReportContext, AdminUser } from '../../types/app';
import { palette } from '../../theme/palette';

type Section = 'overview' | 'users' | 'reports';

const reportStatusOptions = ['Pending', 'Under Review', 'Resolved', 'Dismissed'];
const reportStatusToId: Record<string, number> = {
  Pending: 1,
  'Under Review': 2,
  Resolved: 3,
  Dismissed: 4,
};

export function AdminScreen() {
  const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [contexts, setContexts] = useState<Record<number, AdminReportContext>>({});

  const [query, setQuery] = useState('');
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});
  const [selectedActions, setSelectedActions] = useState<Record<number, 'warn' | 'suspend' | 'ban' | 'dismiss'>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [suspensionReasons, setSuspensionReasons] = useState<Record<number, string>>({});
  const [suspendedUntil, setSuspendedUntil] = useState<Record<number, string>>({});

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [overviewData, userData, reportData] = await Promise.all([
        getAdminOverview(),
        getAdminUsers(),
        getAdminReports(),
      ]);
      setOverview(overviewData);
      setUsers(userData);
      setReports(reportData);
      setSelectedStatuses(
        reportData.reduce((acc: Record<number, string>, item: AdminReport) => {
          acc[item.id] = item.status;
          return acc;
        }, {})
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q) || String(u.id).includes(q));
  }, [users, query]);

  async function toggleRole(user: AdminUser) {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateAdminUserRole(user.id, nextRole);
      setUsers((curr) => curr.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    } catch {
      setError('Failed to update user role.');
    }
  }

  async function deleteUser(userId: number) {
    try {
      await deleteAdminUser(userId);
      setUsers((curr) => curr.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to delete user.');
    }
  }

  async function openReport(reportId: number) {
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
      return;
    }

    setExpandedReportId(reportId);
    if (contexts[reportId]) return;

    try {
      const data = await getAdminReportContext(reportId);
      setContexts((curr) => ({ ...curr, [reportId]: data }));
      if (data.report.internal_note) {
        setNotes((curr) => ({ ...curr, [reportId]: data.report.internal_note || '' }));
      }
      if (data.reportedUser.suspensionReason) {
        setSuspensionReasons((curr) => ({ ...curr, [reportId]: data.reportedUser.suspensionReason || '' }));
      }
      if (data.reportedUser.suspendedUntil) {
        setSuspendedUntil((curr) => ({ ...curr, [reportId]: data.reportedUser.suspendedUntil || '' }));
      }
    } catch {
      setError('Failed to load report context.');
    }
  }

  async function saveStatus(reportId: number) {
    const statusName = selectedStatuses[reportId];
    const statusId = reportStatusToId[statusName];
    if (!statusId) {
      setError('Pick a valid status.');
      return;
    }

    try {
      await updateAdminReportStatus(reportId, statusId);
      setReports((curr) => curr.map((r) => (r.id === reportId ? { ...r, status: statusName } : r)));
    } catch {
      setError('Failed to update report status.');
    }
  }

  async function applyModeration(reportId: number) {
    const action = selectedActions[reportId];
    if (!action) {
      setError('Choose moderation action first.');
      return;
    }

    try {
      await moderateAdminReport({
        reportId,
        action,
        statusName: selectedStatuses[reportId] || 'Resolved',
        note: notes[reportId] || '',
        suspensionReason: suspensionReasons[reportId] || '',
        suspendedUntil: suspendedUntil[reportId] || '',
      });

      await loadAll();
      const freshContext = await getAdminReportContext(reportId);
      setContexts((curr) => ({ ...curr, [reportId]: freshContext }));
    } catch {
      setError('Failed to apply moderation action.');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Moderation and operations controls.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.sectionTabs}>
        <SectionButton label="Overview" active={section === 'overview'} onPress={() => setSection('overview')} />
        <SectionButton label="Users" active={section === 'users'} onPress={() => setSection('users')} />
        <SectionButton label="Reports" active={section === 'reports'} onPress={() => setSection('reports')} />
      </View>

      {section === 'overview' && overview ? (
        <View style={styles.grid}>
          <MetricCard label="Total users" value={overview.totalUsers} />
          <MetricCard label="Active users" value={overview.activeUsers} />
          <MetricCard label="Total matches" value={overview.totalMatches} />
          <MetricCard label="Open reports" value={overview.openReports} />
        </View>
      ) : null}

      {section === 'users' ? (
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by email or user id"
            placeholderTextColor={palette.textMuted}
          />

          {filteredUsers.map((u) => (
            <View key={`user-${u.id}`} style={styles.userRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userTitle}>#{u.id} · {u.email}</Text>
                <Text style={styles.userMeta}>Role: {u.role} · Status: {u.account_status}</Text>
              </View>
              <Pressable style={styles.smallButton} onPress={() => void toggleRole(u)}>
                <Text style={styles.smallButtonText}>{u.role === 'admin' ? 'Demote' : 'Promote'}</Text>
              </Pressable>
              <Pressable style={styles.smallDangerButton} onPress={() => void deleteUser(u.id)}>
                <Text style={styles.smallDangerText}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {section === 'reports' ? (
        <View style={styles.card}>
          {reports.map((r) => {
            const context = contexts[r.id];
            const expanded = expandedReportId === r.id;
            const currentAction = selectedActions[r.id];

            return (
              <View key={`report-${r.id}`} style={styles.reportBlock}>
                <Text style={styles.reportTitle}>#{r.id} · {r.type} · {r.status}</Text>
                <Text style={styles.reportMeta}>Reporter: {r.reporter_email}</Text>
                <Text style={styles.reportMeta}>Reported: {r.reported_email}</Text>
                <Text style={styles.reportDesc}>{r.description || 'No description'}</Text>

                <View style={styles.optionRow}>
                  {reportStatusOptions.map((statusName) => {
                    const active = (selectedStatuses[r.id] || r.status) === statusName;
                    return (
                      <Pressable
                        key={`${r.id}-status-${statusName}`}
                        style={[styles.optionPill, active && styles.optionPillActive]}
                        onPress={() => setSelectedStatuses((curr) => ({ ...curr, [r.id]: statusName }))}
                      >
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>{statusName}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.rowActions}>
                  <Pressable style={styles.smallButton} onPress={() => void saveStatus(r.id)}>
                    <Text style={styles.smallButtonText}>Save Status</Text>
                  </Pressable>
                  <Pressable style={styles.smallButton} onPress={() => void openReport(r.id)}>
                    <Text style={styles.smallButtonText}>{expanded ? 'Hide' : 'Open'}</Text>
                  </Pressable>
                </View>

                {expanded && context ? (
                  <View style={styles.contextPanel}>
                    <Text style={styles.contextHeader}>Reporter stats</Text>
                    <Text style={styles.reportMeta}>Total reports: {context.reporterStats.totalReports}</Text>
                    <Text style={styles.reportMeta}>Open reports: {context.reporterStats.openReports}</Text>

                    <Text style={styles.contextHeader}>Reported profile</Text>
                    <Text style={styles.reportMeta}>{context.reportedUser.fullName || context.reportedUser.email}</Text>
                    <Text style={styles.reportMeta}>Status: {context.reportedUser.accountStatus}</Text>
                    {context.reportedUser.bio ? <Text style={styles.reportDesc}>{context.reportedUser.bio}</Text> : null}
                    {context.reportedUser.photos.length > 0 ? (
                      <ScrollView horizontal contentContainerStyle={styles.photoRow}>
                        {context.reportedUser.photos.map((photo, idx) => (
                          <Image key={`${r.id}-photo-${idx}`} source={{ uri: buildMediaUrl(photo) }} style={styles.reportPhoto} />
                        ))}
                      </ScrollView>
                    ) : null}

                    <Text style={styles.contextHeader}>Action</Text>
                    <View style={styles.optionRow}>
                      {(['warn', 'suspend', 'ban', 'dismiss'] as const).map((act) => {
                        const active = currentAction === act;
                        return (
                          <Pressable
                            key={`${r.id}-action-${act}`}
                            style={[styles.optionPill, active && styles.optionPillActive]}
                            onPress={() => setSelectedActions((curr) => ({ ...curr, [r.id]: act }))}
                          >
                            <Text style={[styles.optionText, active && styles.optionTextActive]}>{act}</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <TextInput
                      style={[styles.input, styles.multiline]}
                      value={notes[r.id] || ''}
                      onChangeText={(value) => setNotes((curr) => ({ ...curr, [r.id]: value }))}
                      placeholder="Internal note"
                      placeholderTextColor={palette.textMuted}
                      multiline
                    />

                    {currentAction === 'suspend' ? (
                      <>
                        <TextInput
                          style={styles.input}
                          value={suspensionReasons[r.id] || ''}
                          onChangeText={(value) => setSuspensionReasons((curr) => ({ ...curr, [r.id]: value }))}
                          placeholder="Suspension reason"
                          placeholderTextColor={palette.textMuted}
                        />
                        <TextInput
                          style={styles.input}
                          value={suspendedUntil[r.id] || ''}
                          onChangeText={(value) => setSuspendedUntil((curr) => ({ ...curr, [r.id]: value }))}
                          placeholder="Suspended until (YYYY-MM-DD HH:MM:SS)"
                          placeholderTextColor={palette.textMuted}
                        />
                      </>
                    ) : null}

                    <Pressable style={styles.primaryButton} onPress={() => void applyModeration(r.id)}>
                      <Text style={styles.primaryButtonText}>Apply Moderation</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

function SectionButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.sectionButton, active && styles.sectionButtonActive]} onPress={onPress}>
      <Text style={[styles.sectionButtonText, active && styles.sectionButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#32457b',
    backgroundColor: '#15254c',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sectionButtonActive: {
    borderColor: '#ffffff',
    backgroundColor: '#f4f7ff',
  },
  sectionButtonText: {
    color: '#d6e1ff',
    fontWeight: '700',
  },
  sectionButtonTextActive: {
    color: '#08112d',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: palette.panel,
    padding: 12,
    gap: 6,
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 12,
  },
  metricValue: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: palette.panel,
    padding: 12,
    gap: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#33406a',
    backgroundColor: palette.panelSoft,
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  userRow: {
    borderTopWidth: 1,
    borderTopColor: '#1f2f5c',
    paddingTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  userTitle: {
    color: palette.text,
    fontWeight: '700',
  },
  userMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  smallButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3d5593',
    backgroundColor: '#1a2a53',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallButtonText: {
    color: '#d7e2ff',
    fontWeight: '700',
    fontSize: 12,
  },
  smallDangerButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7f2534',
    backgroundColor: '#3a1220',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallDangerText: {
    color: '#fecdd3',
    fontWeight: '700',
    fontSize: 12,
  },
  reportBlock: {
    borderTopWidth: 1,
    borderTopColor: '#1f2f5c',
    paddingTop: 10,
    gap: 6,
  },
  reportTitle: {
    color: palette.text,
    fontWeight: '800',
    fontSize: 16,
  },
  reportMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  reportDesc: {
    color: '#c8d5fb',
    fontSize: 13,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#32457b',
    backgroundColor: '#15254c',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  optionPillActive: {
    borderColor: '#ffffff',
    backgroundColor: '#f4f7ff',
  },
  optionText: {
    color: '#d6e1ff',
    fontSize: 12,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#08112d',
  },
  contextPanel: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a3a67',
    backgroundColor: '#0f1a3d',
    padding: 10,
    gap: 8,
  },
  contextHeader: {
    color: '#e8edff',
    fontWeight: '800',
    fontSize: 14,
  },
  photoRow: {
    gap: 8,
  },
  reportPhoto: {
    width: 74,
    height: 74,
    borderRadius: 10,
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#08112d',
    fontWeight: '800',
  },
});
