// src/lib/ai/questionBank.ts
import type { Question, Specialty, InterviewMode } from '../../types/interview'

export const QUESTION_BANK: Question[] = [
  // ── Internal Medicine ──────────────────────────────────────────────────
  // Behavioral
  { id: 'im-b-001', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Tell me about a time you managed a diagnostic dilemma. How did you approach the uncertainty?',
    followUps: ['What would you do differently?', 'How did the patient respond?'] },
  { id: 'im-b-002', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Describe a situation where you had to deliver difficult news to a patient or family.',
    followUps: ['How did you prepare?', 'What was the outcome?'] },
  { id: 'im-b-003', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Tell me about a time you disagreed with a senior colleague about a patient\'s management plan.' },
  { id: 'im-b-004', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Describe a time you made a medical error or near-miss. What did you learn from it?' },
  { id: 'im-b-005', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Why are you choosing Internal Medicine? What draws you to long-term patient relationships?' },

  // Clinical
  { id: 'im-c-001', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A 68-year-old with hypertension and DM2 presents with 3 days of progressively worsening dyspnea and bilateral leg edema. Walk me through your evaluation.',
    followUps: ['What initial labs and imaging would you order?', 'What if the BNP is markedly elevated?'] },
  { id: 'im-c-002', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A 45-year-old presents with fatigue, weight loss of 15 lbs over 3 months, and night sweats. How do you approach this workup?' },
  { id: 'im-c-003', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A patient on warfarin for AFib comes in with an INR of 8.5 and mild nosebleed. What is your management?' },
  { id: 'im-c-004', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A 55-year-old with a history of GERD presents with new-onset dysphagia to solids. How do you evaluate this?' },
  { id: 'im-c-005', specialty: 'internal-medicine', mode: 'clinical',
    text: 'Describe your approach to a patient with newly diagnosed type 2 diabetes, HbA1c 9.2%, presenting for initial management.' },

  // ── General Surgery ────────────────────────────────────────────────────
  // Behavioral
  { id: 'gs-b-001', specialty: 'general-surgery', mode: 'behavioral',
    text: 'Surgery can be physically and emotionally demanding. Tell me about a time you performed under significant stress.' },
  { id: 'gs-b-002', specialty: 'general-surgery', mode: 'behavioral',
    text: 'Describe a time you had to tell a patient that surgery was not the right option for them.' },
  { id: 'gs-b-003', specialty: 'general-surgery', mode: 'behavioral',
    text: 'How do you handle a situation when a procedure is not going as planned and you need to call for help?' },

  // Clinical
  { id: 'gs-c-001', specialty: 'general-surgery', mode: 'clinical',
    text: 'A 32-year-old presents with 12 hours of periumbilical pain that has migrated to the RLQ, with fever and rebound tenderness. What is your management?',
    followUps: ['What if imaging shows a perforated appendix?'] },
  { id: 'gs-c-002', specialty: 'general-surgery', mode: 'clinical',
    text: 'An 80-year-old with a history of COPD presents with acute small bowel obstruction. How do you assess surgical risk and make an operative decision?' },
  { id: 'gs-c-003', specialty: 'general-surgery', mode: 'clinical',
    text: 'A patient returns 48 hours post-laparoscopic cholecystectomy with fever, RUQ pain, and elevated bilirubin. Walk me through your evaluation.' },

  // ── Psychiatry ─────────────────────────────────────────────────────────
  // Behavioral
  { id: 'psy-b-001', specialty: 'psychiatry', mode: 'behavioral',
    text: 'Psychiatry often involves patients in crisis. Tell me about a time you de-escalated a volatile situation with a patient.' },
  { id: 'psy-b-002', specialty: 'psychiatry', mode: 'behavioral',
    text: 'How do you maintain boundaries and self-care when working with patients experiencing severe trauma?' },
  { id: 'psy-b-003', specialty: 'psychiatry', mode: 'behavioral',
    text: 'Why psychiatry? What specific experiences led you to this field?' },

  // Clinical
  { id: 'psy-c-001', specialty: 'psychiatry', mode: 'clinical',
    text: 'A 28-year-old is brought in by police after threatening to harm himself. He is agitated and refuses to talk. How do you approach this evaluation?',
    followUps: ['Under what criteria would you initiate an involuntary hold?'] },
  { id: 'psy-c-002', specialty: 'psychiatry', mode: 'clinical',
    text: 'A 19-year-old college student presents with two weeks of decreased sleep, elevated mood, grandiosity, and impulsive spending. What is your differential and initial approach?' },
  { id: 'psy-c-003', specialty: 'psychiatry', mode: 'clinical',
    text: 'A 45-year-old on lithium for bipolar disorder presents with tremor, confusion, and GI upset. What do you suspect and how do you manage it?' },

  // ── Pediatrics ─────────────────────────────────────────────────────────
  // Behavioral
  { id: 'ped-b-001', specialty: 'pediatrics', mode: 'behavioral',
    text: 'Pediatrics requires communicating with both children and their parents. Tell me about a time these conversations were in tension.' },
  { id: 'ped-b-002', specialty: 'pediatrics', mode: 'behavioral',
    text: 'How do you approach a family that refuses a recommended vaccine or treatment for their child?' },
  { id: 'ped-b-003', specialty: 'pediatrics', mode: 'behavioral',
    text: 'Describe an experience that shaped your commitment to working with children.' },

  // Clinical
  { id: 'ped-c-001', specialty: 'pediatrics', mode: 'clinical',
    text: 'A 2-month-old presents with fever of 38.5°C. The parents are anxious. Walk me through your evaluation.',
    followUps: ['At what temperature threshold does your management change?', 'What is your sepsis workup?'] },
  { id: 'ped-c-002', specialty: 'pediatrics', mode: 'clinical',
    text: 'A 4-year-old presents with stridor, drooling, and a tripod position. What is your immediate approach?' },
  { id: 'ped-c-003', specialty: 'pediatrics', mode: 'clinical',
    text: 'A 10-year-old with known asthma presents with an acute exacerbation not responding to initial albuterol. What is your step-up treatment plan?' },

  // ── Emergency Medicine ─────────────────────────────────────────────────
  // Behavioral
  { id: 'em-b-001', specialty: 'emergency-medicine', mode: 'behavioral',
    text: 'Emergency medicine means managing uncertainty with incomplete information. Give me an example of a time you had to act quickly without all the data.' },
  { id: 'em-b-002', specialty: 'emergency-medicine', mode: 'behavioral',
    text: 'How do you manage moral distress when a trauma patient arrives and survival seems unlikely?' },
  { id: 'em-b-003', specialty: 'emergency-medicine', mode: 'behavioral',
    text: 'Describe a time you had to lead a resuscitation team. What did you learn about team dynamics?' },

  // Clinical
  { id: 'em-c-001', specialty: 'emergency-medicine', mode: 'clinical',
    text: 'A 55-year-old male presents with crushing substernal chest pain radiating to the left arm. His ECG shows ST elevation in leads II, III, aVF. What is your immediate management?',
    followUps: ['The cath lab is 45 minutes away. What is your decision regarding thrombolytics?'] },
  { id: 'em-c-002', specialty: 'emergency-medicine', mode: 'clinical',
    text: 'A 30-year-old pedestrian struck by a car arrives with GCS of 12, tachycardia, and hypotension. Walk me through your primary survey.' },
  { id: 'em-c-003', specialty: 'emergency-medicine', mode: 'clinical',
    text: 'A patient presents with anaphylaxis after a bee sting. What is your immediate treatment and monitoring plan?' },

  // ── Family Medicine ────────────────────────────────────────────────────
  // Behavioral
  { id: 'fm-b-001', specialty: 'family-medicine', mode: 'behavioral',
    text: 'Family medicine requires breadth across the lifespan. Tell me about an experience that highlighted the value of longitudinal patient relationships.' },
  { id: 'fm-b-002', specialty: 'family-medicine', mode: 'behavioral',
    text: 'How do you address health disparities you encounter in your patient population?' },
  { id: 'fm-b-003', specialty: 'family-medicine', mode: 'behavioral',
    text: 'Describe a time you coordinated care across multiple specialists for a complex patient. What challenges did you face?' },

  // Clinical
  { id: 'fm-c-001', specialty: 'family-medicine', mode: 'clinical',
    text: 'A 50-year-old presents for an annual physical. He has hypertension, obesity (BMI 34), and a family history of CAD. What is your preventive care agenda for this visit?' },
  { id: 'fm-c-002', specialty: 'family-medicine', mode: 'clinical',
    text: 'A 16-year-old comes in alone for a well visit. You notice signs of depression and she asks about confidentiality. How do you navigate this?' },
  { id: 'fm-c-003', specialty: 'family-medicine', mode: 'clinical',
    text: 'A 72-year-old with COPD, CHF, and DM2 on 12 medications is struggling with polypharmacy side effects. How do you approach medication reconciliation?' },
]

export function getQuestions(
  specialty: Specialty,
  mode: InterviewMode
): Question[] {
  if (mode === 'mixed') {
    return QUESTION_BANK.filter(q => q.specialty === specialty)
  }
  return QUESTION_BANK.filter(q => q.specialty === specialty && q.mode === mode)
}

export function getQuestion(
  specialty: Specialty,
  mode: InterviewMode,
  index: number
): Question | undefined {
  return getQuestions(specialty, mode)[index]
}
