import { TPSection } from '@/types';
import { SignalAnalysisView } from '@/components/dsp/SignalAnalysisView';
import { CustomSignalView } from '@/components/dsp/CustomSignalView';
import { SignalDecompositionView } from '@/components/dsp/SignalDecompositionView';

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
    ],
  },
];

export const getTpById = (id: string) => TP_SECTIONS.find(tp => tp.id === id);
export const getExerciseById = (tpId: string, exoId: string) => {
  const tp = getTpById(tpId);
  return tp?.exercises.find(exo => exo.id === exoId);
};
