import React from 'react';
import type {
  AdStateSnapshot,
  VastUIConfig,
  VastUIRenderProps,
} from '@react-ad-engine/core';
import { VastAdContainer } from './VastAdContainer';
import { VastAdBadge } from './VastAdBadge';
import { VastCountdown } from './VastCountdown';
import { VastSkipButton } from './VastSkipButton';
import { VastProgressBar } from './VastProgressBar';
import { VastMuteButton } from './VastMuteButton';
import { VastCTAButton } from './VastCTAButton';
import { VastCloseButton } from './VastCloseButton';
import { VastImageAd } from './VastImageAd';
import { VastTextAd } from './VastTextAd';

export interface VastAdOverlayProps extends VastUIRenderProps {
  state: AdStateSnapshot;
  ui?: Partial<VastUIConfig>;
  onSkip?: () => void;
  onClick?: () => void;
  onClose?: () => void;
  onToggleMute?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const VastAdOverlay: React.FC<VastAdOverlayProps> = ({
  state,
  ui,
  onSkip = () => {},
  onClick = () => {},
  onClose = () => {},
  onToggleMute = () => {},
  renderSkipButton,
  renderAdBadge,
  renderCountdown,
  renderCTA,
  renderProgressBar,
  renderMuteButton,
  renderCloseButton,
  renderImageAd,
  renderTextAd,
  style,
  className,
}) => {
  // Headless mode check
  if (ui?.enabled === false) {
    return null;
  }

  // Active ad check
  if (!state.isAdActive) {
    return null;
  }

  const isLinear = Boolean(state.currentCreative?.linear);
  const remainingSeconds = Math.max(0, Math.ceil(state.duration - state.currentTime));
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${mins}:${String(secs).padStart(2, '0')}`;

  // 1. Non-linear image banner
  if (!isLinear && state.nonLinearAds.length > 0) {
    const nl = state.nonLinearAds[0];
    const imageUrl = nl.staticResource?.url || '';

    if (renderImageAd) {
      return renderImageAd({ state, nonLinear: nl, imageUrl, onClick, onClose });
    }

    return (
      <VastAdContainer style={style} className={className}>
        <VastImageAd
          state={state}
          nonLinear={nl}
          imageUrl={imageUrl}
          onClick={onClick}
          onClose={onClose}
        />
      </VastAdContainer>
    );
  }

  // 2. Custom TextAd
  if (!isLinear && state.textAd) {
    if (renderTextAd) {
      return renderTextAd({ state, textAd: state.textAd, onClick, onClose });
    }

    return (
      <VastAdContainer style={style} className={className}>
        <VastTextAd
          state={state}
          textAd={state.textAd}
          onClick={onClick}
          onClose={onClose}
        />
      </VastAdContainer>
    );
  }

  // 3. Linear Video Ad UI Controls
  return (
    <VastAdContainer style={style} className={className}>
      {/* Ad Badge */}
      {renderAdBadge ? (
        renderAdBadge({ state, text: ui?.adBadge?.text || 'ADVERTISEMENT' })
      ) : (
        <VastAdBadge
          state={state}
          text={ui?.adBadge?.text || 'ADVERTISEMENT'}
          config={ui?.adBadge}
        />
      )}

      {/* Countdown */}
      {renderCountdown ? (
        renderCountdown({ state, remainingSeconds, formattedTime })
      ) : (
        <VastCountdown
          state={state}
          remainingSeconds={remainingSeconds}
          formattedTime={formattedTime}
          config={ui?.countdown}
        />
      )}

      {/* Mute / Unmute Button */}
      {renderMuteButton ? (
        renderMuteButton({ state, isMuted: state.isMuted, onToggleMute })
      ) : (
        <VastMuteButton
          state={state}
          isMuted={state.isMuted}
          onToggleMute={onToggleMute}
          config={ui?.muteButton}
        />
      )}

      {/* Skip Button (with countdown until available) */}
      {state.isSkippable &&
        (renderSkipButton ? (
          renderSkipButton({
            state,
            canSkip: state.canSkip,
            skipCountdown: state.skipCountdown,
            onSkip,
            text: ui?.skipButton?.text || 'Skip Ad',
          })
        ) : (
          <VastSkipButton
            state={state}
            canSkip={state.canSkip}
            skipCountdown={state.skipCountdown}
            onSkip={onSkip}
            text={ui?.skipButton?.text || 'Skip Ad'}
            config={ui?.skipButton}
          />
        ))}

      {/* CTA Button */}
      {renderCTA ? (
        renderCTA({
          state,
          text: ui?.ctaButton?.text || 'Learn More',
          onClick,
          url: state.currentCreative?.linear?.videoClicks?.clickThrough?.url,
        })
      ) : (
        <VastCTAButton
          state={state}
          text={ui?.ctaButton?.text || 'Learn More'}
          onClick={onClick}
          url={state.currentCreative?.linear?.videoClicks?.clickThrough?.url}
          config={ui?.ctaButton}
        />
      )}

      {/* Optional Close Button */}
      {ui?.closeButton?.enabled &&
        (renderCloseButton ? (
          renderCloseButton({ state, onClose })
        ) : (
          <VastCloseButton state={state} onClose={onClose} config={ui?.closeButton} />
        ))}

      {/* Progress Bar */}
      {renderProgressBar ? (
        renderProgressBar({
          state,
          progress: state.progress,
          currentTime: state.currentTime,
          duration: state.duration,
        })
      ) : (
        <VastProgressBar
          state={state}
          progress={state.progress}
          currentTime={state.currentTime}
          duration={state.duration}
          config={ui?.progressBar}
        />
      )}
    </VastAdContainer>
  );
};
