
import { Component, signal, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { ChatComponent, ChatMessage } from './components/chat.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ChatComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  // Application State
  currentStep = signal<'upload' | 'analyzing' | 'result'>('upload');
  selectedImage = signal<string | null>(null);
  
  // Data State
  storyData = signal<{ title: string, mood: string, sceneAnalysis: string, storyOpening: string } | null>(null);
  
  // Chat State
  chatMessages = signal<ChatMessage[]>([]);
  isChatLoading = signal(false);

  // Audio State
  isSpeaking = signal(false);
  synth = window.speechSynthesis;
  utterance: SpeechSynthesisUtterance | null = null;

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Remove data URL prefix to get base64
        const base64 = result.split(',')[1];
        this.selectedImage.set(base64);
        this.generateStory(base64);
      };
      
      reader.readAsDataURL(file);
    }
  }

  async generateStory(base64: string) {
    this.currentStep.set('analyzing');
    try {
      const data = await this.geminiService.analyzeAndWriteStory(base64);
      this.storyData.set(data);
      this.currentStep.set('result');
    } catch (error) {
      console.error('Error generating story:', error);
      // Reset on error
      this.currentStep.set('upload');
      alert('Failed to generate story. Please try another image.');
    }
  }

  toggleSpeech() {
    if (this.isSpeaking()) {
      this.synth.cancel();
      this.isSpeaking.set(false);
      return;
    }

    const text = this.storyData()?.storyOpening;
    if (!text) return;

    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a "good" voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices[0];
    if (preferredVoice) this.utterance.voice = preferredVoice;

    this.utterance.rate = 0.9; // Slightly slower for storytelling
    this.utterance.pitch = 1.0;

    this.utterance.onend = () => {
      this.isSpeaking.set(false);
    };

    this.synth.speak(this.utterance);
    this.isSpeaking.set(true);
  }

  async onChatSend(message: string) {
    const img = this.selectedImage();
    if (!img) return;

    // Optimistic update
    this.chatMessages.update(msgs => [...msgs, { role: 'user', text: message }]);
    this.isChatLoading.set(true);

    try {
      const response = await this.geminiService.chatWithImage(img, this.chatMessages(), message);
      this.chatMessages.update(msgs => [...msgs, { role: 'model', text: response }]);
    } catch (error) {
      console.error('Chat error', error);
      this.chatMessages.update(msgs => [...msgs, { role: 'model', text: "I can't hear you clearly right now..." }]);
    } finally {
      this.isChatLoading.set(false);
    }
  }

  reset() {
    this.currentStep.set('upload');
    this.selectedImage.set(null);
    this.storyData.set(null);
    this.chatMessages.set([]);
    this.synth.cancel();
    this.isSpeaking.set(false);
  }
}
