import { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Bell, BellRing, Brain, Calendar, CheckCircle2, Cloud, FileDown, Gamepad2, Heart, Loader2, Pill, Droplets, TrendingUp, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { getCognitiveState } from '@/lib/adaptiveDifficulty';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { CaregiverAlert, CognitiveState, Reminder, GameScore } from '@/types';

const ALERT_PRESETS: Omit<CaregiverAlert, 'id' | 'created_at'>[] = [
  { label: 'Missed Medicine Alert', enabled: true },
  { label: 'Low Water Intake Alert', enabled: true },
  { label: 'No Game Activity Today', enabled: false },
  { label: 'Missed Doctor Appointment', enabled: true },
];

function levelLabelKey(level: number): string {
  return level === 1 ? 'levelEasy' : level === 2 ? 'levelMedium' : 'levelChallenging';
}

function levelLabelEn(level: number): string {
  return level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Challenging';
}

const LEVEL_COLORS: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: 'bg-success-100', text: 'text-success-800', ring: 'ring-success-400' },
  2: { bg: 'bg-secondary-100', text: 'text-secondary-800', ring: 'ring-secondary-400' },
  3: { bg: 'bg-accent-100', text: 'text-accent-800', ring: 'ring-accent-400' },
};

const PATIENT_PROFILE = {
  name: 'Mrs. Barman',
  age: 76,
  language: 'Assamese',
  caregiver: 'Ananya Barman (Daughter)',
};

export function CaregiverScreen() {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [alerts, setAlerts] = useState<CaregiverAlert[]>([]);
  const [cognitive, setCognitive] = useState<CognitiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [lastSynced, setLastSynced] = useState<string>(() => loadJSON<string>(STORAGE_KEYS.lastSynced, ''));

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [remindersRes, scoresRes, alertsRes, cognitiveRes] = await Promise.all([
      supabase.from('reminders').select('*').gte('created_at', today).order('scheduled_time'),
      supabase.from('game_scores').select('*').order('played_at', { ascending: false }).limit(10),
      supabase.from('caregiver_alerts').select('*').order('created_at'),
      getCognitiveState(),
    ]);

    setReminders(remindersRes.data || []);
    setScores(scoresRes.data || []);
    setCognitive(cognitiveRes);

    if (!alertsRes.data || alertsRes.data.length === 0) {
      const { data: seeded } = await supabase
        .from('caregiver_alerts')
        .insert(ALERT_PRESETS)
        .select('*');
      setAlerts(seeded || []);
    } else {
      setAlerts(alertsRes.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      const now = new Date().toISOString();
      setLastSynced(now);
      saveJSON(STORAGE_KEYS.lastSynced, now);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // The print layout already includes its own margins/header, so map the
      // full-width capture straight onto the page and paginate cleanly.
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position -= pageHeight;
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Sahayata_Patient_Report.pdf');
    } catch (err) {
      console.error('[v0] PDF generation failed:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const formatLastSynced = () => {
    if (!lastSynced) return '—';
    const diff = Date.now() - new Date(lastSynced).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const toggleAlert = async (alert: CaregiverAlert) => {
    const newEnabled = !alert.enabled;
    setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, enabled: newEnabled } : a)));
    await supabase.from('caregiver_alerts').update({ enabled: newEnabled }).eq('id', alert.id);
  };

  // Calculate activity stats
  const completedReminders = reminders.filter((r) => r.completed).length;
  const totalReminders = reminders.length;
  const reminderProgress = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 0;

  const medicineTotal = reminders.filter((r) => r.type === 'medicine').length;
  const medicineDone = reminders.filter((r) => r.type === 'medicine' && r.completed).length;
  const medicineProgress = medicineTotal > 0 ? Math.round((medicineDone / medicineTotal) * 100) : 0;

  const waterTotal = reminders.filter((r) => r.type === 'water').length;
  const waterDone = reminders.filter((r) => r.type === 'water' && r.completed).length;
  const waterProgress = waterTotal > 0 ? Math.round((waterDone / waterTotal) * 100) : 0;

  const doctorTotal = reminders.filter((r) => r.type === 'doctor').length;
  const doctorDone = reminders.filter((r) => r.type === 'doctor' && r.completed).length;
  const doctorProgress = doctorTotal > 0 ? Math.round((doctorDone / doctorTotal) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const gamesPlayedToday = scores.filter(
    (s) => s.played_at && new Date(s.played_at).toISOString().split('T')[0] === todayStr
  ).length;
  const bestMoves = scores.length > 0 ? Math.min(...scores.map((s) => s.moves)) : 0;
  const avgMoves = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.moves, 0) / scores.length) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-lg text-primary-600">Loading...</p>
      </div>
    );
  }

  const cognitiveLevel = cognitive?.level ?? 1;
  const levelColor = LEVEL_COLORS[cognitiveLevel] || LEVEL_COLORS[1];

  const reportGeneratedOn = new Date().toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-fade-in px-5 pb-6">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-pop">
          <div className="flex items-center gap-2 rounded-xl bg-success-600 px-4 py-3 shadow-card-lg">
            <CheckCircle2 size={22} className="text-white" strokeWidth={2.5} />
            <span className="text-base font-semibold text-white">{t('syncSuccess')}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-4 pt-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-400 shadow-card">
          <Heart size={32} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary-900">{t('caregiverDashboard')}</h1>
          <p className="text-lg text-primary-700">{t('howDoing')}</p>
        </div>
      </div>

      {/* Sync button */}
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
            <Cloud size={24} className="text-primary-600" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-500">{t('lastSynced')}</p>
            <p className="text-base font-bold text-primary-800">{formatLastSynced()}</p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 font-bold transition-all active:scale-95 ${
            syncing
              ? 'bg-primary-300 text-primary-600'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {syncing ? (
            <>
              <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
              <span className="text-base">{t('syncing')}</span>
            </>
          ) : (
            <>
              <Cloud size={20} strokeWidth={2.5} />
              <span className="text-base">{t('syncData')}</span>
            </>
          )}
        </button>
      </div>

      {/* Download Weekly Report */}
      <button
        onClick={handleDownloadPdf}
        disabled={generatingPdf}
        className={`mb-6 flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-lg font-bold shadow-card-lg transition-all active:scale-[0.98] ${
          generatingPdf
            ? 'bg-accent-300 text-accent-800'
            : 'bg-accent-600 text-white hover:bg-accent-700'
        }`}
      >
        {generatingPdf ? (
          <>
            <Loader2 size={24} className="animate-spin" strokeWidth={2.5} />
            <span>Preparing report...</span>
          </>
        ) : (
          <>
            <FileDown size={24} strokeWidth={2.5} />
            <span>Download Weekly Report (PDF)</span>
          </>
        )}
      </button>

      {/* Patient Profile */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-primary-100">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary-600 shadow-card">
            <User size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-semibold text-primary-900">{PATIENT_PROFILE.name}</h2>
            <p className="text-base font-medium text-primary-500">Age {PATIENT_PROFILE.age}</p>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-secondary-100 px-2.5 py-1">
              <Heart size={16} className="text-secondary-700" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-secondary-800">Cared for by {PATIENT_PROFILE.caregiver}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-cream-100 p-3">
            <p className="text-sm font-medium text-primary-500">Primary Language</p>
            <p className="text-lg font-bold text-primary-800">{PATIENT_PROFILE.language}</p>
          </div>
          <div className={`rounded-xl ${levelColor.bg} p-3`}>
            <p className="text-sm font-medium text-primary-600">AI Cognitive Level</p>
            <p className={`text-lg font-bold ${levelColor.text}`}>{t(levelLabelKey(cognitiveLevel))}</p>
          </div>
        </div>
      </div>

      {/* Cognitive Level Badge */}
      <div className={`mb-6 rounded-2xl ${levelColor.bg} p-5 shadow-card ring-2 ${levelColor.ring}`}>
        <div className="mb-2 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${levelColor.text} bg-white/70`}>
            <Brain size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-800">{t('cognitiveLevel')}</h2>
            <span className={`text-2xl font-bold ${levelColor.text}`}>
              {t(levelLabelKey(cognitiveLevel))}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-white/60 p-3">
          <TrendingUp size={20} className="mt-0.5 shrink-0 text-primary-600" strokeWidth={2.5} />
          <p className="text-base font-medium text-primary-700">
            {cognitive?.adjustment_note || t('startingLevel')}
          </p>
        </div>
      </div>

      {/* Overall daily activity */}
      <div className="mb-4 rounded-2xl bg-primary-700 p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Activity size={24} className="text-secondary-300" strokeWidth={2.5} />
          <h2 className="text-xl font-bold text-white">{t('dailyActivity')}</h2>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg text-primary-200">{t('overallCompletion')}</span>
          <span className="text-2xl font-bold text-secondary-300">{reminderProgress}%</span>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-primary-800">
          <div
            className="h-full rounded-full bg-secondary-400 transition-all duration-700 ease-out"
            style={{ width: `${reminderProgress}%` }}
          />
        </div>
        <p className="mt-2 text-base text-primary-300">
          {completedReminders} {t('of')} {totalReminders} {t('tasksCompletedToday')}
        </p>
      </div>

      {/* Breakdown by category */}
      <div className="mb-6 flex flex-col gap-3">
        <ProgressBar icon={<Pill size={22} className="text-secondary-700" strokeWidth={2.5} />} label={t('medicine')} done={medicineDone} total={medicineTotal} progress={medicineProgress} barColor="bg-secondary-500" />
        <ProgressBar icon={<Droplets size={22} className="text-primary-700" strokeWidth={2.5} />} label={t('water')} done={waterDone} total={waterTotal} progress={waterProgress} barColor="bg-primary-500" />
        <ProgressBar icon={<Calendar size={22} className="text-accent-700" strokeWidth={2.5} />} label={t('appointments')} done={doctorDone} total={doctorTotal} progress={doctorProgress} barColor="bg-accent-500" />
      </div>

      {/* Memory game scores */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Gamepad2 size={24} className="text-primary-600" strokeWidth={2.5} />
          <h2 className="text-xl font-bold text-primary-800">{t('memoryGameScores')}</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t('gamesToday')} value={String(gamesPlayedToday)} color="text-primary-700" />
          <StatCard label={t('bestMoves')} value={bestMoves > 0 ? String(bestMoves) : '—'} color="text-success-700" />
          <StatCard label={t('avgMoves')} value={avgMoves > 0 ? String(avgMoves) : '—'} color="text-secondary-700" />
        </div>

        {scores.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-base font-semibold text-primary-600">{t('recentGames')}</h3>
            <div className="flex flex-col gap-2">
              {scores.slice(0, 4).map((score) => (
                <div key={score.id} className="flex items-center justify-between rounded-xl bg-cream-100 px-4 py-2">
                  <span className="text-base text-primary-700">
                    {new Date(score.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary-100 px-2 py-0.5 text-sm font-semibold text-primary-700">
                      {score.moves} {t('moves')}
                    </span>
                    <span className="rounded-lg bg-secondary-100 px-2 py-0.5 text-sm font-semibold text-secondary-700">
                      {score.duration_seconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scores.length === 0 && (
          <p className="mt-2 text-base text-primary-500">{t('noGamesYet')}</p>
        )}
      </div>

      {/* Alert settings */}
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <BellRing size={24} className="text-accent-600" strokeWidth={2.5} />
          <h2 className="text-xl font-bold text-primary-800">{t('alertSettings')}</h2>
        </div>
        <p className="mb-4 text-base text-primary-500">{t('alertSettingsSub')}</p>

        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => toggleAlert(alert)}
              className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 active:scale-[0.98] ${
                alert.enabled ? 'border-accent-300 bg-accent-50' : 'border-primary-100 bg-cream-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={24} className={alert.enabled ? 'text-accent-600' : 'text-primary-300'} strokeWidth={2.5} />
                <span className={`text-lg font-semibold ${alert.enabled ? 'text-accent-800' : 'text-primary-400'}`}>
                  {alert.label}
                </span>
              </div>
              <div className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-200 ${alert.enabled ? 'bg-accent-500' : 'bg-primary-200'}`}>
                <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${alert.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden print-only A4 layout — the only element captured for the PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div
          ref={reportRef}
          style={{
            width: '794px',
            minHeight: '1123px',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            padding: '56px 60px',
            boxSizing: 'border-box',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {/* Report header */}
          <div style={{ borderBottom: '3px solid #1a1a1a', paddingBottom: '16px', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, letterSpacing: '0.2px' }}>
              Sahayata — Weekly Cognitive Health Report
            </h1>
            <p style={{ fontSize: '13px', margin: '8px 0 0', color: '#444', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              Generated: {reportGeneratedOn}
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#777', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              Confidential — for caregiver and medical review only
            </p>
          </div>

          {/* Patient details */}
          <h2 style={printSectionHeading}>Patient Details</h2>
          <table style={printTable}>
            <tbody>
              <tr>
                <td style={printLabelCell}>Name</td>
                <td style={printValueCell}>{PATIENT_PROFILE.name}</td>
                <td style={printLabelCell}>Age</td>
                <td style={printValueCell}>{PATIENT_PROFILE.age} years</td>
              </tr>
              <tr>
                <td style={printLabelCell}>Primary Language</td>
                <td style={printValueCell}>{PATIENT_PROFILE.language}</td>
                <td style={printLabelCell}>AI Cognitive Level</td>
                <td style={printValueCell}>{levelLabelEn(cognitiveLevel)}</td>
              </tr>
              <tr>
                <td style={printLabelCell}>Primary Caregiver</td>
                <td style={printValueCell} colSpan={3}>{PATIENT_PROFILE.caregiver}</td>
              </tr>
            </tbody>
          </table>
          {cognitive?.adjustment_note && (
            <p style={{ fontSize: '13px', margin: '10px 2px 0', color: '#333', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <strong>Clinical note:</strong> {cognitive.adjustment_note}
            </p>
          )}

          {/* Activity summary */}
          <h2 style={printSectionHeading}>Activity Summary (Today)</h2>
          <table style={printTable}>
            <tbody>
              <tr>
                <td style={printLabelCell}>Medicine Adherence</td>
                <td style={printValueCell}>{medicineDone}/{medicineTotal} ({medicineProgress}%)</td>
              </tr>
              <tr>
                <td style={printLabelCell}>Water Intake</td>
                <td style={printValueCell}>{waterDone}/{waterTotal} ({waterProgress}%)</td>
              </tr>
              <tr>
                <td style={printLabelCell}>Appointments Attended</td>
                <td style={printValueCell}>{doctorDone}/{doctorTotal} ({doctorProgress}%)</td>
              </tr>
              <tr>
                <td style={printLabelCell}>Overall Task Completion</td>
                <td style={printValueCell}>{completedReminders}/{totalReminders} ({reminderProgress}%)</td>
              </tr>
            </tbody>
          </table>

          {/* Game analytics */}
          <h2 style={printSectionHeading}>Memory Game Analytics</h2>
          <table style={printTable}>
            <tbody>
              <tr>
                <td style={printLabelCell}>Games Played Today</td>
                <td style={printValueCell}>{gamesPlayedToday}</td>
                <td style={printLabelCell}>Best (Fewest Moves)</td>
                <td style={printValueCell}>{bestMoves > 0 ? bestMoves : '—'}</td>
                <td style={printLabelCell}>Average Moves</td>
                <td style={printValueCell}>{avgMoves > 0 ? avgMoves : '—'}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '20px 0 8px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            Recent Games
          </h3>
          {scores.length > 0 ? (
            <table style={{ ...printTable, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={printHeaderCell}>Date</th>
                  <th style={printHeaderCell}>Moves</th>
                  <th style={printHeaderCell}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {scores.slice(0, 8).map((score) => (
                  <tr key={score.id}>
                    <td style={printDataCell}>
                      {new Date(score.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={printDataCell}>{score.moves}</td>
                    <td style={printDataCell}>{score.duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '13px', color: '#555', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              No memory games recorded in this period.
            </p>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ccc', marginTop: '40px', paddingTop: '12px' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
              This report is auto-generated by Sahayata Daily Care Companion. Cognitive level is estimated by the app&apos;s adaptive-difficulty engine and is not a medical diagnosis. Please consult a qualified physician for clinical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const printSectionHeading: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  margin: '28px 0 10px',
  paddingBottom: '4px',
  borderBottom: '1px solid #999',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const printTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '13px',
};

const printLabelCell: React.CSSProperties = {
  border: '1px solid #bbb',
  padding: '8px 10px',
  backgroundColor: '#f2f2f2',
  fontWeight: 700,
  color: '#333',
  textAlign: 'left',
  width: '18%',
};

const printValueCell: React.CSSProperties = {
  border: '1px solid #bbb',
  padding: '8px 10px',
  color: '#1a1a1a',
  textAlign: 'left',
};

const printHeaderCell: React.CSSProperties = {
  border: '1px solid #bbb',
  padding: '8px 10px',
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontWeight: 700,
  textAlign: 'left',
};

const printDataCell: React.CSSProperties = {
  border: '1px solid #bbb',
  padding: '7px 10px',
  color: '#1a1a1a',
  textAlign: 'left',
};

function ProgressBar({ icon, label, done, total, progress, barColor }: { icon: React.ReactNode; label: string; done: number; total: number; progress: number; barColor: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-lg font-bold text-primary-800">{label}</span>
        </div>
        <span className="text-base font-semibold text-primary-500">{done}/{total}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-primary-100">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-cream-100 p-3 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-primary-500">{label}</div>
    </div>
  );
}
