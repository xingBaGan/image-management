import React, { useState } from 'react';
import { LocalImageData } from '../types/index.ts';
import { Copy, CheckSquare } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';

interface MetadataTabProps {
    image: LocalImageData;
}

interface PromptTagsProps {
    title: string;
    prompts: string[];
}

const PromptTags: React.FC<PromptTagsProps> = ({ title, prompts }) => {
    const { t } = useLocale();
    const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(new Set());

    const togglePrompt = (index: number) => {
        const newSelected = new Set(selectedPrompts);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedPrompts(newSelected);
    };

    const copySelected = async () => {
        const selectedText = Array.from(selectedPrompts).map((index: number) => prompts[index]);
        const selectedTextJson = JSON.stringify(selectedText);
        await navigator.clipboard.writeText(selectedTextJson);
        toast.info(t('copyPromptsSuccess'), {
          position: 'bottom-right',
        });
    };

    const copyAll = async () => {
        const allText = JSON.stringify(prompts);
        await navigator.clipboard.writeText(allText);
        toast.info(t('copyPromptsSuccess'), {
          position: 'bottom-right',
        });
    };

    return (
        <div className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[8rem] bg-white/30 backdrop-blur-md dark:bg-gray-800/30">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 dark:text-blue-300">{title}</label>
                <div className="flex gap-1">
                    {selectedPrompts.size > 0 && (
                        <button
                            onClick={copySelected}
                            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-1"
                            title={t('copySelectedPrompts')}
                        >
                            <Copy className="w-3 h-3" />
                            {t('copySelectedPrompts')}
                        </button>
                    )}
                    <button
                        onClick={copyAll}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                        title={t('copyAllPrompts')}
                    >
                        <Copy className="w-3 h-3" />
                        {t('copyAllPrompts')}
                    </button>
                </div>
            </div>
            <div className="flex overflow-y-auto relative flex-wrap gap-2 mb-2 h-40 tags-container">
                {prompts.map((prompt, index) => {
                    const isSelected = selectedPrompts.has(index);
                    return (
                        <div
                            key={index}
                            className={`flex gap-1 items-center px-2 py-1 h-7 text-sm rounded-full group cursor-pointer transition-colors ${
                                isSelected
                                    ? 'text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
                                    : 'text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => togglePrompt(index)}
                            title={prompt}
                        >
                            <span className="truncate max-w-32">{prompt}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MetadataTab: React.FC<MetadataTabProps> = ({ image }) => {
    const { t } = useLocale();

    if (image.type !== 'image' || !image.metadata) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>{t('noMetadataAvailable')}</p>
            </div>
        );
    }


    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-500 dark:text-blue-300">{t('generator')}</label>
                <p className="text-gray-900 dark:text-white text-sm">{image.metadata.generator}</p>
            </div>

            {image.metadata.positive_prompts && image.metadata.positive_prompts.length > 0 && (
                <PromptTags
                    title={t('positivePrompt')}
                    prompts={image.metadata.positive_prompts}
                />
            )}

            {image.metadata.negative_prompts && image.metadata.negative_prompts.length > 0 && (
                <PromptTags
                    title={t('negativePrompt')}
                    prompts={image.metadata.negative_prompts}
                />
            )}

            <div>
                <label className="text-xs text-gray-500 dark:text-blue-300">{t('model')}</label>
                {typeof image.metadata.model === 'string' ? (
                    <p className="text-gray-900 dark:text-white text-sm">{image.metadata.model}</p>
                ) : (
                    <div className="space-y-1">
                        <p className="text-gray-900 dark:text-white text-sm">{t('name')}: {image.metadata.model.name}</p>
                        <p className="text-gray-900 dark:text-white text-sm">{t('hash')}: {image.metadata.model.hash}</p>
                        <p className="text-gray-900 dark:text-white text-sm">{t('id')}: {image.metadata.model.model_id}</p>
                    </div>
                )}
            </div>

            <div>
                <label className="text-xs text-gray-500 dark:text-blue-300">{t('sampler')}</label>
                <div className="space-y-1">
                    <p className="text-gray-900 dark:text-white text-sm">{t('name')}: {image.metadata.samplers.name}</p>
                    <p className="text-gray-900 dark:text-white text-sm">{t('scheduler')}: {image.metadata.samplers.parameters.scheduler}</p>
                    <p className="text-gray-900 dark:text-white text-sm">{t('cfgScale')}: {image.metadata.samplers.parameters.cfg_scale}</p>
                    <p className="text-gray-900 dark:text-white text-sm">{t('seed')}: {image.metadata.samplers.parameters.seed}</p>
                    <p className="text-gray-900 dark:text-white text-sm">{t('steps')}: {image.metadata.samplers.parameters.steps}</p>
                </div>
            </div>
        </div>
    );
};

export default MetadataTab;
