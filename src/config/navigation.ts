import { TPSection } from '@/types';
import { SignalAnalysisView } from '@/components/dsp/SignalAnalysisView';
import { CustomSignalView } from '@/components/dsp/CustomSignalView';
import { SignalDecompositionView } from '@/components/dsp/SignalDecompositionView';
import { SignalDerivativesView } from '@/components/dsp/SignalDerivativesView';
import { SignalParityView } from '@/components/dsp/SignalParityView';
import { SignalExo6View } from '@/components/dsp/SignalExo6View';

export const TP_SECTIONS: TPSection[] = [
  {
    id: 'tp1',
    number: 1,
    title: 'Signaux et Analyse Énergétique',
    description: 'Analyse des signaux mathématiques et classification énergétique',
    exercises: [
      {
        id: 'tp1-exo1',
        number: 1,
        title: 'Analyse Complète des Signaux',
        description: 'Visualisation, classification énergétique et calcul de puissance',
        component: SignalAnalysisView,
      },
      {
        id: 'tp1-exo2',
        number: 2,
        title: 'Signal Personnalisé',
        description: 'Créez et analysez vos propres signaux',
        component: CustomSignalView,
      },
      {
        id: 'tp1-exo3',
        number: 3,
        title: 'Décomposition en Signaux Élémentaires',
        description: 'Exprimer les signaux en fonction de Rect, Tri, U, δ et R',
        component: SignalDecompositionView,
      },
      {
        id: 'tp1-exo4',
        number: 4,
        title: 'Dérivées de x14(t)',
        description: 'Visualiser la première et deuxième dérivée du signal triangle x14(t)',
        component: SignalDerivativesView,
      },
      {
        id: 'tp1-exo5',
        number: 5,
        title: 'Parties Paire et Impaire',
        description: 'Décomposer des signaux en parties paire et impaire',
        component: SignalParityView,
      },
    ],
  },
];

export const getTpById = (id: string) => TP_SECTIONS.find(tp => tp.id === id);
export const getExerciseById = (tpId: string, exoId: string) => {
  const tp = getTpById(tpId);
  return tp?.exercises.find(exo => exo.id === exoId);
};
