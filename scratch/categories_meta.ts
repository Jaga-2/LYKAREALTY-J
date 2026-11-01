import fs from 'fs';
import path from 'path';

export interface ConversationExample {
  id: string;
  category_id: number;
  category: string;
  customer_message: string;
  context: string;
  detected_intent: string;
  emotion_mood: string;
  expected_response: string;
  recommended_action: string;
  language: 'english' | 'tamil' | 'tanglish' | 'arabic';
}

export const CATEGORIES_META = [
  { id: 1, name: 'greetings', title: 'Greetings – Hi, Hello, Hey, Good morning', doc: '01_greetings_and_smalltalk.md' },
  { id: 2, name: 'different_ways_to_say_hello', title: 'Different ways people say hello', doc: '01_greetings_and_smalltalk.md' },
  { id: 3, name: 'how_are_you', title: 'How are you? – Different responses', doc: '01_greetings_and_smalltalk.md' },
  { id: 4, name: 'casual_conversations_smalltalk', title: 'Casual conversations and small talk', doc: '01_greetings_and_smalltalk.md' },
  { id: 5, name: 'friendly_conversations', title: 'Friendly conversations', doc: '01_greetings_and_smalltalk.md' },
  { id: 6, name: 'happy_customer', title: 'Happy customer conversations', doc: '02_customer_emotions_and_rapport.md' },
  { id: 7, name: 'sad_disappointed_customer', title: 'Sad or disappointed customers', doc: '02_customer_emotions_and_rapport.md' },
  { id: 8, name: 'angry_frustrated_customer', title: 'Angry or frustrated customers', doc: '02_customer_emotions_and_rapport.md' },
  { id: 9, name: 'confused_customer', title: 'Confused customers', doc: '02_customer_emotions_and_rapport.md' },
  { id: 10, name: 'excited_customer', title: 'Excited customers', doc: '02_customer_emotions_and_rapport.md' },
  { id: 11, name: 'thank_you', title: 'Thank-you conversations', doc: '03_conversational_navigation.md' },
  { id: 12, name: 'goodbye_farewell', title: 'Goodbye and farewell conversations', doc: '03_conversational_navigation.md' },
  { id: 13, name: 'asking_for_help', title: 'Asking for help', doc: '03_conversational_navigation.md' },
  { id: 14, name: 'asking_repeated_questions', title: 'Asking repeated questions', doc: '03_conversational_navigation.md' },
  { id: 15, name: 'different_ways_of_asking_same_question', title: 'Different ways of asking the same question', doc: '03_conversational_navigation.md' },
  { id: 16, name: 'informal_english', title: 'Informal English & Slang', doc: '04_linguistic_variations_and_voice.md' },
  { id: 17, name: 'fillers', title: 'Fillers – Like, You know, Actually, Umm, Uh', doc: '04_linguistic_variations_and_voice.md' },
  { id: 18, name: 'incomplete_sentences', title: 'Incomplete sentences', doc: '04_linguistic_variations_and_voice.md' },
  { id: 19, name: 'grammar_and_typos', title: 'Grammar mistakes and spelling variations', doc: '04_linguistic_variations_and_voice.md' },
  { id: 20, name: 'short_answers', title: 'Short answers', doc: '03_conversational_navigation.md' },
  { id: 21, name: 'changing_topics', title: 'Changing topics', doc: '03_conversational_navigation.md' },
  { id: 22, name: 'correcting_previous_statements', title: 'Correcting previous statements', doc: '03_conversational_navigation.md' },
  { id: 23, name: 'asking_for_clarification', title: 'Asking for clarification', doc: '03_conversational_navigation.md' },
  { id: 24, name: 'jokes_humour', title: 'Jokes and light humour', doc: '04_linguistic_variations_and_voice.md' },
  { id: 25, name: 'human_like_followups', title: 'Human-like follow-up conversations', doc: '03_conversational_navigation.md' },
  { id: 26, name: 'tamil_conversations', title: 'Tamil conversations', doc: '05_multilingual_conversations.md' },
  { id: 27, name: 'tanglish_conversations', title: 'Tanglish conversations', doc: '05_multilingual_conversations.md' },
  { id: 28, name: 'arabic_conversations', title: 'Arabic conversations', doc: '05_multilingual_conversations.md' },
  { id: 29, name: 'voice_patterns', title: 'Voice conversation patterns', doc: '04_linguistic_variations_and_voice.md' },
  { id: 30, name: 'customer_relationship_empathy', title: 'Customer relationship and empathy', doc: '02_customer_emotions_and_rapport.md' }
];

