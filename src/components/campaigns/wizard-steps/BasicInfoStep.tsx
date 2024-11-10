import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Candidature } from '../../../types/campaign';
import { Info } from 'lucide-react';

interface BasicInfoStepProps {
  formData: {
    name: string;
    candidatureId: string;
    endDate?: string;
    sendToAllCandidates: boolean;
    selectedCandidates?: string[];
  };
  onFormDataChange: (data: any) => void;
  onNext: () => void;
}

export function BasicInfoStep({ formData, onFormDataChange, onNext }: BasicInfoStepProps) {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidatures();
  }, []);

  useEffect(() => {
    if (formData.candidatureId && !formData.sendToAllCandidates) {
      fetchCandidatesForCandidature(formData.candidatureId);
    }
  }, [formData.candidatureId, formData.sendToAllCandidates]);

  const fetchCandidatures = async () => {
    setLoading(true);
    try {
      const candidaturesCollection = collection(db, 'candidatures');
      const candidaturesSnapshot = await getDocs(candidaturesCollection);
      const candidaturesList = candidaturesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Candidature));
      setCandidatures(candidaturesList);
    } catch (error) {
      console.error('Error fetching candidatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatesForCandidature = async (candidatureId: string) => {
    try {
      const candidatesCollection = collection(db, 'candidates');
      const candidatesSnapshot = await getDocs(candidatesCollection);
      const candidatesList = candidatesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(candidate => candidate.candidatureId === candidatureId);
      setCandidates(candidatesList);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const handleCandidatureChange = (candidatureId: string) => {
    const selectedCandidature = candidatures.find(c => c.id === candidatureId);
    if (selectedCandidature) {
      const currentDate = new Date().toLocaleDateString('es-ES');
      const departmentName = selectedCandidature.department?.name || 'Sin departamento';
      const autoName = `${selectedCandidature.title} - ${departmentName} - ${currentDate}`;
      onFormDataChange({ 
        ...formData, 
        candidatureId,
        name: autoName,
        selectedCandidates: []
      });
    }
  };

  const handleCandidateSelection = (candidateId: string) => {
    const newSelectedCandidates = formData.selectedCandidates?.includes(candidateId)
      ? formData.selectedCandidates.filter(id => id !== candidateId)
      : [...(formData.selectedCandidates || []), candidateId];
    
    onFormDataChange({
      ...formData,
      selectedCandidates: newSelectedCandidates
    });
  };

  const isValid = formData.name && formData.candidatureId && formData.endDate && 
    (formData.sendToAllCandidates || (formData.selectedCandidates && formData.selectedCandidates.length > 0));

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Información básica de la campaña</p>
          <p>
            Define los detalles principales de tu campaña. Esta información te ayudará
            a organizar y hacer seguimiento de tus procesos de reclutamiento.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Candidatura asociada
          </label>
          <select
            value={formData.candidatureId}
            onChange={(e) => handleCandidatureChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona una candidatura</option>
            {candidatures.map(candidature => (
              <option key={candidature.id} value={candidature.id}>
                {candidature.title} - {candidature.department?.name || 'Sin departamento'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la campaña
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre de la campaña"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de finalización
          </label>
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => onFormDataChange({ ...formData, endDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            La campaña se marcará como completada en esta fecha
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destinatarios de la campaña
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.sendToAllCandidates}
                onChange={() => onFormDataChange({ ...formData, sendToAllCandidates: true, selectedCandidates: [] })}
                className="mr-2"
              />
              <span>Enviar a todos los candidatos</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.sendToAllCandidates}
                onChange={() => onFormDataChange({ ...formData, sendToAllCandidates: false })}
                className="mr-2"
              />
              <span>Seleccionar candidatos específicos</span>
            </label>

            {!formData.sendToAllCandidates && formData.candidatureId && (
              <div className="mt-4 border rounded-lg divide-y">
                {candidates.map(candidate => (
                  <label key={candidate.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedCandidates?.includes(candidate.id)}
                      onChange={() => handleCandidateSelection(candidate.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.email}</div>
                    </div>
                  </label>
                ))}
                {candidates.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No hay candidatos disponibles para esta candidatura
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

