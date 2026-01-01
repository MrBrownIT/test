
import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true, // Optional in v19+ but good practice
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div class="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 class="font-display text-lg text-purple-300">Ask the Narrator</h3>
        <span class="text-xs text-gray-500 uppercase tracking-widest">Gemini Powered</span>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        @for (msg of messages(); track $index) {
          <div [class]="'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')">
            <div [class]="'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ' + 
              (msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none')">
              {{ msg.text }}
            </div>
          </div>
        }
        
        @if (isLoading()) {
          <div class="flex justify-start">
            <div class="bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-2 items-center">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        }
      </div>

      <div class="p-3 bg-gray-900 border-t border-gray-700">
        <form (ngSubmit)="sendMessage()" class="flex gap-2">
          <input 
            type="text" 
            [(ngModel)]="userInput" 
            name="userInput"
            placeholder="Ask about the world..." 
            class="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            [disabled]="isLoading()"
          >
          <button 
            type="submit" 
            [disabled]="!userInput || isLoading()"
            class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChatComponent {
  messages = input.required<ChatMessage[]>();
  isLoading = input<boolean>(false);
  onSend = output<string>();
  
  userInput = '';

  sendMessage() {
    if (!this.userInput.trim()) return;
    this.onSend.emit(this.userInput);
    this.userInput = '';
  }
}
