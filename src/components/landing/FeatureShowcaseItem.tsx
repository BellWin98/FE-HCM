import type { FeatureShowcaseItemConfig } from './featureShowcaseData';
import { FeatureMedia } from './FeatureMedia';

type FeatureShowcaseItemProps = {
  item: FeatureShowcaseItemConfig;
};

export const FeatureShowcaseItem = ({ item }: FeatureShowcaseItemProps) => {
  const Icon = item.icon;
  const isImageLeft = item.imagePosition === 'left';
  const isTextFirstOnMobile = !isImageLeft && (item.id === 'upload' || item.id === 'chat');

  const imageWrapperClassName = isImageLeft
    ? 'order-2 lg:order-1'
    : isTextFirstOnMobile
      ? 'order-2 lg:order-2'
      : 'lg:order-2';

  const textWrapperClassName = isImageLeft
    ? 'order-1 lg:order-2'
    : isTextFirstOnMobile
      ? 'order-1 lg:order-1'
      : 'lg:order-1';

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div className={imageWrapperClassName}>
        <FeatureMedia
          src={item.mediaSrc}
          alt={item.mediaAlt}
          icon={Icon}
          placeholderBg={item.placeholderBg}
          aspectRatio="4/9"
        />
      </div>
      <div className={textWrapperClassName}>
        <div className="mb-4 flex items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBgClassName}`}
          >
            <Icon className={`h-5 w-5 ${item.iconColorClassName}`} />
          </div>
          <span className={`text-sm font-medium ${item.labelClassName}`}>{item.label}</span>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-slate-900">{item.title}</h3>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          {item.description.split('\n').map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};
