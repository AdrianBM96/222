import React, { useState, useEffect } from 'react';
import { CampaignStep, CalendarProvider, StepCondition, CandidateStatus } from '../../../../types/campaign';
import { Calendar, Clock, Info, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { settingsService } from '../../../../services/settingsService';
import { ConditionsEditor } from './ConditionsEditor';

interface InterviewSchedulerEditorProps {
  step: CampaignStep;
  onSave: (updatedStep: CampaignStep) => void;
}

interface CalendarStatus {
  google: boolean;
  microsoft: boolean;
}

const statusOptions = [
  { value: 'new', label: 'Nuevo' },
  { value: 'form_submitted', label: 'Formulario enviado' },
  { value: 'under_review', label: 'En revisión' },
  { value: 'interview_scheduled', label: 'Entrevista programada' },
  { value: 'interview_completed', label: 'Entrevista completada' },
  { value: 'selected', label: 'Seleccionado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'withdrawn', label: 'Retirado' }
];

const VARIABLES = [
  { key: '{{firstName}}', description: 'Nombre del candidato' },
  { key: '{{position}}', description: 'Título de la posición' },
  { key: '{{company}}', description: 'Nombre de la empresa' },
  { key: '{{recruiterName}}', description: 'Tu nombre' },
  { key: '{{schedulingLink}}', description: 'Link para agendar' },
];


const DEFAULT_MESSAGE = `¡Hola {{firstName}}! 👋

¡Excelentes noticias! Hemos revisado tu perfil y nos gustaría avanzar a la siguiente etapa del proceso de selección para la posición de {{position}} en {{company}}.

Me gustaría coordinar una entrevista contigo para conocernos mejor y discutir la oportunidad en detalle. Puedes agendar directamente en el horario que mejor te convenga usando este link: {{schedulingLink}}

¡Espero poder conversar pronto contigo!

Saludos,
{{recruiterName}}`;

export function InterviewSchedulerEditor({ step, onSave }: InterviewSchedulerEditorProps) {
  const [calendarConfig, setCalendarConfig] = useState({
    provider: step.config.calendarConfig?.provider || 'google',
    daysAvailable: step.config.calendarConfig?.daysAvailable || 7,
    workingHours: {
      start: step.config.calendarConfig?.workingHours?.start || '09:00',
      end: step.config.calendarConfig?.workingHours?.end || '18:00',
    },
    duration: step.config.calendarConfig?.duration || 45,
  });

  const [message, setMessage] = useState(step.config.message || DEFAULT_MESSAGE);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    google: false,
    microsoft: false
  });

  useEffect(() => {
    const checkCalendarConnections = async () => {
      const googleConnection = await settingsService.getCalendarConnection('google');
      const microsoftConnection = await settingsService.getCalendarConnection('microsoft');
      
      setCalendarStatus({
        google: googleConnection?.connected || false,
        microsoft: microsoftConnection?.connected || false
      });
    };

    checkCalendarConnections();
  }, []);

  const handleSave = () => {
    if (!calendarStatus[calendarConfig.provider]) {
      alert('Por favor, conecta primero tu cuenta de calendario en la sección de configuración.');
      return;
    }

    onSave({
      ...step,
      config: {
        ...step.config,
        calendarConfig,
        message,
      },
    });
  };

  const handleProviderChange = (provider: CalendarProvider) => {
    if (!calendarStatus[provider]) {
      alert('Por favor, conecta primero tu cuenta de calendario en la sección de configuración.');
      return;
    }
    setCalendarConfig({ ...calendarConfig, provider });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('interview-message-input') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    setMessage(before + variable + after);
    
    setTimeout(() => {
      textarea.selectionStart = start + variable.length;
      textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Configuración del calendario</p>
          <p>
            Configura los parámetros para la programación automática de entrevistas.
            Los candidatos solo verán los horarios disponibles dentro del rango especificado.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MessageSquare className="w-4 h-4 inline-block mr-1" />
            Mensaje de invitación
          </label>
          <div className="mb-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {VARIABLES.map(({ key, description }) => (
                <button
                  key={key}
                  onClick={() => insertVariable(key)}
                  className="inline-flex items-center px-2.5 py-1.5 bg-white border border-blue-200 rounded text-xs hover:bg-blue-50"
                >
                  <code className="text-blue-600 mr-1.5">{key}</code>
                  <span className="text-blue-700">{description}</span>
                </button>
              ))}
            </div>
            <textarea
              id="interview-message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe el mensaje de invitación..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Proveedor de calendario
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleProviderChange('google')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg ${
                calendarConfig.provider === 'google'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <img src="/google-calendar.svg" alt="Google Calendar" className="w-6 h-6 mr-2" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Google Calendar</span>
                {calendarStatus.google ? (
                  <span className="text-xs text-green-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Conectado
                  </span>
                ) : (
                  <span className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    No conectado
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleProviderChange('microsoft')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg ${
                calendarConfig.provider === 'microsoft'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <img src="/outlook-calendar.svg" alt="Outlook Calendar" className="w-6 h-6 mr-2" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Outlook Calendar</span>
                {calendarStatus.microsoft ? (
                  <span className="text-xs text-green-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Conectado
                  </span>
                ) : (
                  <span className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    No conectado
                  </span>
                )}
              </div>
            </button>
          </div>
          {!calendarStatus[calendarConfig.provider] && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Para usar este calendario, primero debes conectar tu cuenta en la sección de configuración
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Días disponibles
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="30"
                value={calendarConfig.daysAvailable}
                onChange={(e) => setCalendarConfig({
                  ...calendarConfig,
                  daysAvailable: Number(e.target.value)
                })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">días</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Ventana de tiempo disponible para agendar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline-block mr-1" />
              Duración de la entrevista
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="15"
                max="180"
                step="15"
                value={calendarConfig.duration}
                onChange={(e) => setCalendarConfig({
                  ...calendarConfig,
                  duration: Number(e.target.value)
                })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">minutos</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Horario laboral
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora inicio</label>
              <input
                type="time"
                value={calendarConfig.workingHours.start}
                onChange={(e) => setCalendarConfig({
                  ...calendarConfig,
                  workingHours: {
                    ...calendarConfig.workingHours,
                    start: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora fin</label>
              <input
                type="time"
                value={calendarConfig.workingHours.end}
                onChange={(e) => setCalendarConfig({
                  ...calendarConfig,
                  workingHours: {
                    ...calendarConfig.workingHours,
                    end: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={!calendarStatus[calendarConfig.provider]}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            calendarStatus[calendarConfig.provider]
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Guardar configuración
        </button>
      </div>
    </div>
  );
}


