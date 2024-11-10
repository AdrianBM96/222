import React, { useState } from 'react';
import { X, Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react';
import { Campaign, Candidature } from '../../types';
import { FormEditor } from './FormEditor';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';

interface CampaignDetailsModalProps {
  campaign: Campaign;
  onClose: () => void;
}

export function CampaignDetailsModal({ campaign, onClose }: CampaignDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
  });
  const [form, setForm] = useState(campaign.form || { sections: [], aiSuggestions: [] });
  const [messages, setMessages] = useState(campaign.messages || []);

  const handleUpdateCampaign = async () => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        ...formData,
        form,
        messages,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Campaña actualizada con éxito');
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Error al actualizar la campaña');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setFormData({ ...formData, status: newStatus });
      toast.success(`Campaña ${newStatus === 'active' ? 'activada' : 'pausada'} con éxito`);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Error al actualizar el estado de la campaña');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la campaña
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Métricas de la campaña</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{campaign.metrics?.sent || 0}</div>
                  <div className="text-sm text-gray-500">Mensajes enviados</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{campaign.metrics?.opened || 0}</div>
                  <div className="text-sm text-gray-500">Mensajes abiertos</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{campaign.metrics?.responded || 0}</div>
                  <div className="text-sm text-gray-500">Respuestas</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{campaign.metrics?.applied || 0}</div>
                  <div className="text-sm text-gray-500">Aplicaciones</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-4">
            {messages?.map((message) => (
              <div key={message.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {message.type === 'initial' ? 'Mensaje inicial' : 'Mensaje de seguimiento'}
                </label>
                <textarea
                  value={message.content}
                  onChange={(e) => setMessages(messages.map(m =>
                    m.id === message.id ? { ...m, content: e.target.value } : m
                  ))}
                  className="input-field"
                  rows={4}
                />
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <FormEditor
            sections={form?.sections || []}
            aiSuggestions={form?.aiSuggestions || []}
            onChange={(sections) => setForm({ ...form, sections })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Detalles de la campaña</h2>
            <p className="mt-1 text-sm text-gray-500">
              Última actualización: {new Date(campaign.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleStatus}
              disabled={isUpdating}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {campaign.status === 'active' ? (
                <><Pause className="w-4 h-4 inline mr-1" /> Pausar</>
              ) : (
                <><Play className="w-4 h-4 inline mr-1" /> Activar</>
              )}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mensajes
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'form'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Formulario
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {renderTab()}
        </div>

        <div className="flex justify-end items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleUpdateCampaign}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isUpdating ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

