import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceService } from '../../../core/services/voice.service';
import { ToastService } from '../../../core/services/toast';
import { ExpenseService } from '../../../core/services/expense';
import { BudgetService } from '../../../core/services/budget';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-voice-entry',
  imports: [CommonModule, FormsModule],
  templateUrl: './voice-entry.html',
  styleUrl: './voice-entry.css',
})
export class VoiceEntry implements OnInit, OnDestroy {
  private voiceService = inject(VoiceService);
  private toastService = inject(ToastService);
  private expenseService = inject(ExpenseService);
  private budgetService = inject(BudgetService);

  isOpen = false;
  isListening = false;
  isParsing = false;
  isSaving = false;
  speechText = '';
  selectedLang = 'en-US';

  parsedData: any = null;
  history: any[] = [];
  analytics: any = null;

  showHistory = false;
  showAnalytics = false;

  private recognition: any = null;

  languages = [
    { code: 'en-US', label: '🇬🇧 English' },
    { code: 'hi-IN', label: '🇮🇳 Hindi' },
    { code: 'gu-IN', label: '🇮🇳 Gujarati' }
  ];

  ngOnInit() {
    this.initSpeechRecognition();
  }

  ngOnDestroy() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
  }

  initSpeechRecognition() {
    this.recognition = this.voiceService.createSpeechRecognition(this.selectedLang);
    if (!this.recognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      this.speechText = '';
      this.parsedData = null;
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.speechText = transcript;
      this.parseVoiceInput(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      if (event.error === 'not-allowed') {
        this.toastService.show(
          'Permission Denied',
          'Please allow microphone access to record voice transactions.',
          'error'
        );
      } else {
        this.toastService.show('Voice Error', 'Speech recognition encountered an error: ' + event.error, 'warning');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  onLangChange() {
    if (this.isListening) {
      this.recognition.stop();
    }
    this.initSpeechRecognition();
  }

  toggleWidget() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadHistory();
      this.loadAnalytics();
    }
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
    this.showAnalytics = false;
  }

  toggleAnalytics() {
    this.showAnalytics = !this.showAnalytics;
    this.showHistory = false;
  }

  startListening() {
    if (!this.recognition) {
      this.toastService.show(
        'Not Supported',
        'Voice Speech Recognition is not supported by your current browser. Please try Chrome or Edge.',
        'error'
      );
      return;
    }
    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  parseVoiceInput(text: string) {
    this.isParsing = true;
    this.voiceService.parseVoiceText(text).subscribe({
      next: (res) => {
        this.isParsing = false;
        if (res.success && res.data) {
          this.parsedData = res.data;
          this.toastService.show('Voice Parsed', `Extracted amount: ₹${res.data.amount}`, 'success');
        } else {
          this.toastService.show('Parsing Failed', 'Could not extract financial terms. Please try again.', 'warning');
        }
      },
      error: (err) => {
        this.isParsing = false;
        console.error(err);
        this.toastService.show('Parsing Error', 'An error occurred while analyzing voice input.', 'error');
      }
    });
  }

  saveTransaction() {
    if (!this.parsedData) return;
    this.isSaving = true;

    const savePayload = {
      voiceText: this.speechText,
      amount: Number(this.parsedData.amount),
      categoryName: this.parsedData.category,
      type: this.parsedData.type,
      title: this.parsedData.title,
      date: new Date().toISOString()
    };

    this.voiceService.saveVoiceTransaction(savePayload).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.show(
          'Transaction Saved',
          `Successfully saved ₹${savePayload.amount} under ${savePayload.categoryName}.`,
          'success'
        );
        this.parsedData = null;
        this.speechText = '';
        
        // Trigger dashboard metrics & reports refresh
        this.expenseService.loadExpenses().subscribe();
        this.budgetService.loadBudgets().subscribe();

        // Refresh voice stats
        this.loadHistory();
        this.loadAnalytics();
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.toastService.show('Save Error', 'An error occurred while saving the transaction.', 'error');
      }
    });
  }

  cancelPreview() {
    this.parsedData = null;
    this.speechText = '';
  }

  loadHistory() {
    this.voiceService.getVoiceHistory().subscribe({
      next: (res) => { this.history = res || []; },
      error: (err) => console.error('Error loading voice history:', err)
    });
  }

  loadAnalytics() {
    this.voiceService.getVoiceAnalytics().subscribe({
      next: (res) => { this.analytics = res; },
      error: (err) => console.error('Error loading voice analytics:', err)
    });
  }
}
