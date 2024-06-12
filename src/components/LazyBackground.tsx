import React from 'react'

interface LazyBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string
  placeholder: string
}

interface LazyBackgroundState {
  src: string | null
}

class LazyBackground extends React.Component<LazyBackgroundProps, LazyBackgroundState> {
  state: LazyBackgroundState = { src: null }

  componentDidMount() {
    const { src } = this.props

    const imageLoader = new Image()
    imageLoader.src = src

    imageLoader.onload = () => {
      this.setState({ src })
    };
  }

//   render() {
//     const { src } = this.state
//     const { placeholder, ...restProps } = this.props

//     return (
//       <div className='App'
//         {...restProps}
//         style={{ backgroundImage: `url(${src /*|| placeholder*/})`, ...restProps.style }}
//       />
//     )
//   }

    render() {
        const { src } = this.state
        const { style, ...restProps } = this.props

        const combinedStyle = {
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundColor: src ? undefined : 'gray',
        ...style,
        }

        return <div className="App" {...restProps} style={combinedStyle} />
    }
}

export default LazyBackground;
