'use client';

import { Target, ChevronRight } from 'lucide-react';
import { Card } from '@/app/components/ui';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Goal {
  id: string | number;
  title: string;
  progress: number;
  color: string;
}

interface GoalsWidgetProps {
  goals: Goal[];
}

export default function GoalsWidget({ goals }: GoalsWidgetProps) {
  const { t } = useTranslation();
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
        <Target size={18} className="text-purple-400" /> {t('dashboard.activeGoals')}
      </h2>
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-300">{goal.title}</span>
              <span className="text-gray-500">{goal.progress}%</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${goal.color} transition-all duration-1000`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-green-900/20">
        <Link href="/goals" className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors w-fit">
          {t('dashboard.allGoals')} <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
    </Card>
  );
}
