import React from 'react'

export type AwesomeReactClass = React.Component & {
  subscriptions: CompositeDisposable;
  stores: Set<Object>;
  props: Object;
  setStore: Function;
  setApp: Function;
  ref: Function;
  addEvent: Function;
  setTimeout: Function;
  setInterval: Function;
  createCompositeDisposable: Function;
  react: Function;
  watch: Function;
}

export type Store = {}
