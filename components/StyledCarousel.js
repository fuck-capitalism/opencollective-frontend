import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSwipeable } from 'react-swipeable';
import styled from 'styled-components';

import Container from './Container';
import { Box, Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';

const CarouselContainer = styled(Container)`
  display: flex;
  transition: ${props => (props.sliding ? 'none' : 'transform 1s ease')};
  transform: ${props => {
    if (props.numSlides === 1) {
      return 'translateX(0%)';
    }

    if (props.numSlides === 2) {
      if (!props.sliding && props.direction === 'next') {
        return 'translateX(calc(-100% - 20px))';
      }
      if (!props.sliding && props.direction === 'prev') {
        return 'translateX(0%)';
      }
      if (props.direction === 'prev') {
        return 'translateX(calc(-100% - 20px))';
      }
      if (!props.sliding) {
        return 'translateX(0%)';
      }

      return 'translateX(0%)';
    }

    if (!props.sliding) {
      return 'translateX(calc(-100% - 20px))';
    }
    if (props.direction === 'prev') {
      return 'translateX(calc(2 * (-100% - 20px)))';
    }
    return 'translateX(0%)';
  }};
`;

const CarouselSlot = styled(Container)`
  flex: 1 0 100%;
  flex-basis: 100%;
  order: ${props => props.order};
`;

const Indicator = styled(Box)`
  cursor: pointer;
  width: 8px;
  height: 8px;
  border: none;
  box-shadow: inset 0px 2px 2px rgba(20, 20, 20, 0.08);
  border-radius: 8px;
  background: ${props => (props.active ? '#DC5F7D' : '#E8E9EB')};
`;

const ControllerButton = styled(StyledRoundButton)`
  padding: 12px;

  &:active {
    background: #141414;
  }
`;

const StyledCarousel = props => {
  const [activeIndex, setActiveIndex] = useState(props.activeIndex || 0);
  const [direction, setDirection] = useState('');
  const [sliding, setSliding] = useState(false);

  const getOrder = itemIndex => {
    const { children } = props;
    const numItems = children.length || 1;
    if (numItems === 2) {
      return itemIndex;
    }

    return (numItems + 1 - activeIndex + itemIndex) % numItems;
  };

  const nextSlide = () => {
    const children = props.children;
    const numItems = children.length || 1;
    if (numItems === activeIndex + 1) {
      return;
    }

    performSliding('next', activeIndex === numItems - 1 ? 0 : activeIndex + 1);
  };

  const prevSlide = () => {
    const children = props.children;
    const numItems = children.length || 1;
    if (activeIndex === 0) {
      return;
    }

    performSliding('prev', activeIndex === 0 ? numItems - 1 : activeIndex - 1);
  };

  const performSliding = (direction, activeIndex) => {
    setDirection(direction);
    setActiveIndex(activeIndex);
    setSliding(true);

    setTimeout(() => {
      setSliding(false);

      if (props.onChange) {
        props.onChange(activeIndex);
      }
    }, 50);
  };

  const handleSwipe = isNext => {
    if (isNext) {
      nextSlide();
    } else {
      prevSlide();
    }
  };

  const handleOnClickIndicator = index => {
    if (index > activeIndex) {
      performSliding('next', index);
      return;
    }

    if (index < activeIndex) {
      performSliding('prev', index);
    }
  };

  const renderRightController = () => {
    const children = props.children;
    const numItems = children.length - 1;

    return (
      <ControllerButton size={40} mx={1} onClick={() => handleSwipe(true)} disabled={activeIndex === numItems}>
        →
      </ControllerButton>
    );
  };

  const renderLeftController = () => {
    return (
      <ControllerButton padding="12px" size={40} mx={1} onClick={() => handleSwipe()} disabled={activeIndex === 0}>
        ←
      </ControllerButton>
    );
  };

  const { children, showArrowController, controllerPosition } = props;
  const handlers = useSwipeable({ onSwipedLeft: () => handleSwipe(true), onSwipedRight: () => handleSwipe() });

  return (
    <Container {...props}>
      <Flex justifyContent="center" alignItems="center" width={1}>
        {showArrowController && controllerPosition === 'side' && renderLeftController()}
        <Box overflow="hidden" px={2}>
          <Container {...handlers}>
            <CarouselContainer sliding={sliding} direction={direction} numSlides={children.length}>
              {React.Children.map(children, (child, index) => {
                return (
                  <CarouselSlot order={getOrder(index)} mx={2}>
                    {child}
                  </CarouselSlot>
                );
              })}
            </CarouselContainer>
          </Container>
        </Box>
        {showArrowController && controllerPosition === 'side' && renderRightController()}
      </Flex>
      <Container width={1} display="flex" alignItems="center" justifyContent={'center'}>
        {showArrowController && controllerPosition === 'bottom' && renderLeftController()}
        <Flex mx={3} my={3} display={props.display}>
          {Array.from({ length: children.length }, (_, i) => (
            <Indicator key={i} active={i === activeIndex} mx={1} onClick={() => handleOnClickIndicator(i)} />
          ))}
        </Flex>
        {showArrowController && controllerPosition === 'bottom' && renderRightController()}
      </Container>
    </Container>
  );
};

StyledCarousel.propTypes = {
  children: PropTypes.any,
  activeIndex: PropTypes.number,
  showArrowController: PropTypes.bool,
  controllerPosition: PropTypes.string,
  onChange: PropTypes.func,
  display: PropTypes.array,
};

StyledCarousel.defaultProps = {
  showArrowController: true,
  controllerPosition: 'bottom',
};

export default StyledCarousel;
