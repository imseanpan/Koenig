import ImgFullIcon from '../../assets/icons/kg-img-full.svg?react';
import ImgRegularIcon from '../../assets/icons/kg-img-regular.svg?react';
import ImgWideIcon from '../../assets/icons/kg-img-wide.svg?react';
import React from 'react';
import {ButtonGroup, IconButton} from './ButtonGroup';

const story = {
    title: 'Generic/Button group',
    component: ButtonGroup,
    subcomponents: {IconButton},
    parameters: {
        status: {
            type: 'functional'
        }
    },
    argTypes: {
        selectedName: {control: 'select', options: ['regular', 'wide', 'full']}
    }
};
export default story;

const Template = (args) => {
    return (
        <ButtonGroup {...args} />
    );
};

export const CardWidth = Template.bind({});
CardWidth.args = {
    selectedName: 'regular',
    buttons: [
        {
            label: 'Regular',
            name: 'regular',
            Icon: ImgRegularIcon
        },
        {
            label: 'Wide',
            name: 'wide',
            Icon: ImgWideIcon
        },
        {
            label: 'Full',
            name: 'full',
            Icon: ImgFullIcon
        }
    ]
};
