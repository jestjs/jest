/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-disable */
module.exports = {
  "remoteModuleConfig": [
    null,
    [
      "StatusBarManager",
      [
        "getHeight",
        "setStyle",
        "setHidden",
        "setNetworkActivityIndicatorVisible",
        "addListener",
        "removeListeners"
      ]
    ],
    [
      "SourceCode",
      {
        "scriptURL": "http:\/\/localhost:8081\/index.ios.bundle?platform=ios&dev=true&minify=false"
      }
    ],
    [
      "AlertManager",
      [
        "alertWithArgs"
      ]
    ],
    [
      "ExceptionsManager",
      [
        "reportSoftException",
        "reportFatalException",
        "updateExceptionMessage",
        "reportUnhandledException"
      ]
    ],
    [
      "DevMenu",
      [
        "show",
        "reload"
      ]
    ],
    [
      "AsyncLocalStorage",
      [
        "multiGet",
        "multiSet",
        "multiMerge",
        "multiRemove",
        "clear",
        "getAllKeys"
      ]
    ],
    [
      "ViewManager",
      {
        "forceTouchAvailable": false
      }
    ],
    null,
    null,
    null,
    null,
    null,
    [
      "ScrollViewManager",
      [
        "getContentSize",
        "calculateChildFrames",
        "scrollTo",
        "zoomToRect"
      ]
    ],
    null,
    [
      "AccessibilityManager",
      [
        "setAccessibilityContentSizeMultipliers",
        "getMultiplier",
        "getCurrentVoiceOverState"
      ]
    ],
    [
      "DevLoadingView",
      [
        "showMessage",
        "hide"
      ]
    ],
    [
      "Timing",
      [
        "createTimer",
        "deleteTimer"
      ]
    ],
    [
      "AppState",
      [
        "getCurrentAppState",
        "addListener",
        "removeListeners"
      ]
    ],
    [
      "JSCExecutor",
      [
        "setContextName"
      ]
    ],
    null,
    [
      "Clipboard",
      [
        "setString",
        "getString"
      ],
      [
        1
      ]
    ],
    null,
    null,
    [
      "KeyboardObserver",
      [
        "addListener",
        "removeListeners"
      ]
    ],
    null,
    null,
    [
      "WebViewManager",
      [
        "goBack",
        "goForward",
        "reload",
        "stopLoading",
        "startLoadWithResult"
      ]
    ],
    null,
    null,
    null,
    [
      "RedBox",
      [
        "dismiss"
      ]
    ],
    null,
    null,
    [
      "UIManager",
      {
        "RCTTextView": {
          "Manager": "RCTTextViewManager",
          "NativeProps": {
            "text": "NSString",
            "color": "UIColor",
            "onTextInput": "BOOL",
            "clearTextOnFocus": "BOOL",
            "autoCorrect": "BOOL",
            "autoCapitalize": "UITextAutocapitalizationType",
            "placeholder": "NSString",
            "secureTextEntry": "BOOL",
            "blurOnSubmit": "BOOL",
            "keyboardType": "UIKeyboardType",
            "mostRecentEventCount": "NSInteger",
            "onChange": "BOOL",
            "fontWeight": "NSString",
            "fontStyle": "NSString",
            "fontSize": "CGFloat",
            "placeholderTextColor": "UIColor",
            "onSelectionChange": "BOOL",
            "fontFamily": "NSString",
            "enablesReturnKeyAutomatically": "BOOL",
            "returnKeyType": "UIReturnKeyType",
            "editable": "BOOL",
            "textAlign": "NSTextAlignment",
            "keyboardAppearance": "UIKeyboardAppearance",
            "maxLength": "NSNumber",
            "selectionColor": "UIColor",
            "selectTextOnFocus": "BOOL"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTSwitch": {
          "Manager": "RCTSwitchManager",
          "NativeProps": {
            "thumbTintColor": "UIColor",
            "tintColor": "UIColor",
            "onTintColor": "UIColor",
            "value": "BOOL",
            "onChange": "BOOL",
            "disabled": "BOOL"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTMap": {
          "Manager": "RCTMapManager",
          "NativeProps": {
            "onAnnotationDragStateChange": "BOOL",
            "followUserLocation": "BOOL",
            "annotations": "NSArray<RCTMapAnnotation *>",
            "rotateEnabled": "BOOL",
            "region": "MKCoordinateRegion",
            "onPress": "BOOL",
            "showsUserLocation": "BOOL",
            "minDelta": "CGFloat",
            "overlays": "NSArray<RCTMapOverlay *>",
            "scrollEnabled": "BOOL",
            "showsCompass": "BOOL",
            "mapType": "MKMapType",
            "legalLabelInsets": "UIEdgeInsets",
            "onChange": "BOOL",
            "maxDelta": "CGFloat",
            "pitchEnabled": "BOOL",
            "zoomEnabled": "BOOL",
            "onAnnotationBlur": "BOOL",
            "showsPointsOfInterest": "BOOL",
            "onAnnotationFocus": "BOOL"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTNavigator": {
          "Manager": "RCTNavigatorManager",
          "NativeProps": {
            "interactivePopGestureEnabled": "BOOL",
            "requestedTopOfStack": "NSInteger",
            "onNavigationProgress": "BOOL",
            "onNavigationComplete": "BOOL"
          },
          "Constants": {

          },
          "Commands": {
            "requestSchedulingJavaScriptNavigation": 0
          }
        },
        "customDirectEventTypes": {
          "topLoadingFinish": {
            "registrationName": "onLoadingFinish"
          },
          "topAccessibilityTap": {
            "registrationName": "onAccessibilityTap"
          },
          "topNavigationProgress": {
            "registrationName": "onNavigationProgress"
          },
          "topLoadStart": {
            "registrationName": "onLoadStart"
          },
          "topError": {
            "registrationName": "onError"
          },
          "topScrollBeginDrag": {
            "registrationName": "onScrollBeginDrag"
          },
          "topMomentumScrollBegin": {
            "registrationName": "onMomentumScrollBegin"
          },
          "topScrollEndDrag": {
            "registrationName": "onScrollEndDrag"
          },
          "topShouldStartLoadWithRequest": {
            "registrationName": "onShouldStartLoadWithRequest"
          },
          "topScrollAnimationEnd": {
            "registrationName": "onScrollAnimationEnd"
          },
          "topMagicTap": {
            "registrationName": "onMagicTap"
          },
          "topTextInput": {
            "registrationName": "onTextInput"
          },
          "topLoadEnd": {
            "registrationName": "onLoadEnd"
          },
          "topLoadingStart": {
            "registrationName": "onLoadingStart"
          },
          "topRefresh": {
            "registrationName": "onRefresh"
          },
          "topScroll": {
            "registrationName": "onScroll"
          },
          "topShow": {
            "registrationName": "onShow"
          },
          "topLoadingError": {
            "registrationName": "onLoadingError"
          },
          "topMomentumScrollEnd": {
            "registrationName": "onMomentumScrollEnd"
          },
          "topProgress": {
            "registrationName": "onProgress"
          },
          "topLoad": {
            "registrationName": "onLoad"
          },
          "topSelectionChange": {
            "registrationName": "onSelectionChange"
          },
          "topLayout": {
            "registrationName": "onLayout"
          }
        },
        "RCTScrollView": {
          "Manager": "RCTScrollViewManager",
          "NativeProps": {
            "showsVerticalScrollIndicator": "BOOL",
            "scrollEventThrottle": "NSTimeInterval",
            "contentOffset": "CGPoint",
            "showsHorizontalScrollIndicator": "BOOL",
            "directionalLockEnabled": "BOOL",
            "decelerationRate": "CGFloat",
            "onScrollBeginDrag": "BOOL",
            "alwaysBounceHorizontal": "BOOL",
            "snapToAlignment": "NSString",
            "scrollsToTop": "BOOL",
            "maximumZoomScale": "CGFloat",
            "keyboardDismissMode": "UIScrollViewKeyboardDismissMode",
            "onMomentumScrollBegin": "BOOL",
            "centerContent": "BOOL",
            "minimumZoomScale": "CGFloat",
            "stickyHeaderIndices": "NSIndexSet",
            "onScroll": "BOOL",
            "bounces": "BOOL",
            "scrollEnabled": "BOOL",
            "snapToInterval": "int",
            "pagingEnabled": "BOOL",
            "onMomentumScrollEnd": "BOOL",
            "scrollIndicatorInsets": "UIEdgeInsets",
            "alwaysBounceVertical": "BOOL",
            "bouncesZoom": "BOOL",
            "contentInset": "UIEdgeInsets",
            "onScrollEndDrag": "BOOL",
            "onScrollAnimationEnd": "BOOL",
            "indicatorStyle": "UIScrollViewIndicatorStyle",
            "automaticallyAdjustContentInsets": "BOOL",
            "zoomScale": "CGFloat",
            "canCancelContentTouches": "BOOL"
          },
          "Constants": {

          },
          "Commands": {
            "getContentSize": 0,
            "calculateChildFrames": 1,
            "scrollTo": 2,
            "zoomToRect": 3
          }
        },
        "customBubblingEventTypes": {
          "topEndEditing": {
            "phasedRegistrationNames": {
              "bubbled": "onEndEditing",
              "captured": "onEndEditingCapture"
            }
          },
          "topAnnotationFocus": {
            "phasedRegistrationNames": {
              "bubbled": "onAnnotationFocus",
              "captured": "onAnnotationFocusCapture"
            }
          },
          "topKeyPress": {
            "phasedRegistrationNames": {
              "bubbled": "onKeyPress",
              "captured": "onKeyPressCapture"
            }
          },
          "topTouchStart": {
            "phasedRegistrationNames": {
              "bubbled": "onTouchStart",
              "captured": "onTouchStartCapture"
            }
          },
          "topTouchMove": {
            "phasedRegistrationNames": {
              "bubbled": "onTouchMove",
              "captured": "onTouchMoveCapture"
            }
          },
          "topSubmitEditing": {
            "phasedRegistrationNames": {
              "bubbled": "onSubmitEditing",
              "captured": "onSubmitEditingCapture"
            }
          },
          "topLeftButtonPress": {
            "phasedRegistrationNames": {
              "bubbled": "onLeftButtonPress",
              "captured": "onLeftButtonPressCapture"
            }
          },
          "topRightButtonPress": {
            "phasedRegistrationNames": {
              "bubbled": "onRightButtonPress",
              "captured": "onRightButtonPressCapture"
            }
          },
          "topSlidingComplete": {
            "phasedRegistrationNames": {
              "bubbled": "onSlidingComplete",
              "captured": "onSlidingCompleteCapture"
            }
          },
          "topTouchEnd": {
            "phasedRegistrationNames": {
              "bubbled": "onTouchEnd",
              "captured": "onTouchEndCapture"
            }
          },
          "topBlur": {
            "phasedRegistrationNames": {
              "bubbled": "onBlur",
              "captured": "onBlurCapture"
            }
          },
          "topAnnotationDragStateChange": {
            "phasedRegistrationNames": {
              "bubbled": "onAnnotationDragStateChange",
              "captured": "onAnnotationDragStateChangeCapture"
            }
          },
          "topAnnotationBlur": {
            "phasedRegistrationNames": {
              "bubbled": "onAnnotationBlur",
              "captured": "onAnnotationBlurCapture"
            }
          },
          "topNavigationComplete": {
            "phasedRegistrationNames": {
              "bubbled": "onNavigationComplete",
              "captured": "onNavigationCompleteCapture"
            }
          },
          "topPress": {
            "phasedRegistrationNames": {
              "bubbled": "onPress",
              "captured": "onPressCapture"
            }
          },
          "topTouchCancel": {
            "phasedRegistrationNames": {
              "bubbled": "onTouchCancel",
              "captured": "onTouchCancelCapture"
            }
          },
          "topFocus": {
            "phasedRegistrationNames": {
              "bubbled": "onFocus",
              "captured": "onFocusCapture"
            }
          },
          "topValueChange": {
            "phasedRegistrationNames": {
              "bubbled": "onValueChange",
              "captured": "onValueChangeCapture"
            }
          },
          "topChange": {
            "phasedRegistrationNames": {
              "bubbled": "onChange",
              "captured": "onChangeCapture"
            }
          }
        },
        "RCTRefreshControl": {
          "Manager": "RCTRefreshControlManager",
          "NativeProps": {
            "tintColor": "UIColor",
            "title": "NSString",
            "onRefresh": "BOOL",
            "titleColor": "UIColor",
            "refreshing": "BOOL"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTSegmentedControl": {
          "Manager": "RCTSegmentedControlManager",
          "NativeProps": {
            "momentary": "BOOL",
            "onChange": "BOOL",
            "tintColor": "UIColor",
            "enabled": "BOOL",
            "selectedIndex": "NSInteger",
            "values": "NSArray<NSString *>"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTSlider": {
          "Manager": "RCTSliderManager",
          "NativeProps": {
            "maximumTrackTintColor": "UIColor",
            "onSlidingComplete": "BOOL",
            "minimumTrackImage": "UIImage",
            "onValueChange": "BOOL",
            "disabled": "BOOL",
            "value": "float",
            "thumbImage": "UIImage",
            "maximumTrackImage": "UIImage",
            "minimumTrackTintColor": "UIColor",
            "step": "float",
            "maximumValue": "float",
            "trackImage": "UIImage",
            "minimumValue": "float"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTPicker": {
          "Manager": "RCTPickerManager",
          "NativeProps": {
            "fontSize": "CGFloat",
            "color": "UIColor",
            "textAlign": "NSTextAlignment",
            "fontWeight": "NSString",
            "fontFamily": "NSString",
            "fontStyle": "NSString",
            "onChange": "BOOL",
            "selectedIndex": "NSInteger",
            "items": "NSArray<NSDictionary *>"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTTabBarItem": {
          "Manager": "RCTTabBarItemManager",
          "NativeProps": {
            "systemIcon": "UITabBarSystemItem",
            "badge": "id",
            "title": "NSString",
            "selected": "BOOL",
            "onPress": "BOOL",
            "renderAsOriginal": "BOOL",
            "icon": "UIImage",
            "selectedIcon": "UIImage"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTProgressView": {
          "Manager": "RCTProgressViewManager",
          "NativeProps": {
            "progressViewStyle": "UIProgressViewStyle",
            "trackImage": "UIImage",
            "trackTintColor": "UIColor",
            "progressImage": "UIImage",
            "progressTintColor": "UIColor",
            "progress": "float"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTText": {
          "Manager": "RCTTextManager",
          "NativeProps": {
            "textShadowColor": "UIColor",
            "textDecorationStyle": "NSUnderlineStyle",
            "color": "UIColor",
            "letterSpacing": "CGFloat",
            "textShadowRadius": "CGFloat",
            "textDecorationLine": "RCTTextDecorationLineType",
            "isHighlighted": "BOOL",
            "lineHeight": "CGFloat",
            "writingDirection": "NSWritingDirection",
            "textDecorationColor": "UIColor",
            "allowFontScaling": "BOOL",
            "textShadowOffset": "CGSize",
            "lineBreakMode": "NSLineBreakMode",
            "fontWeight": "NSString",
            "fontStyle": "NSString",
            "fontSize": "CGFloat",
            "opacity": "CGFloat",
            "fontFamily": "NSString",
            "textAlign": "NSTextAlignment",
            "numberOfLines": "NSUInteger"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTDatePicker": {
          "Manager": "RCTDatePickerManager",
          "NativeProps": {
            "mode": "UIDatePickerMode",
            "timeZoneOffsetInMinutes": "NSTimeZone",
            "minuteInterval": "NSInteger",
            "date": "NSDate",
            "minimumDate": "NSDate",
            "onChange": "BOOL",
            "maximumDate": "NSDate"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTImageView": {
          "Manager": "RCTImageViewManager",
          "NativeProps": {
            "source": "RCTImageSource",
            "onLoadStart": "BOOL",
            "tintColor": "UIColor",
            "onError": "BOOL",
            "defaultSource": "UIImage",
            "onLoad": "BOOL",
            "onLoadEnd": "BOOL",
            "onProgress": "BOOL",
            "capInsets": "UIEdgeInsets",
            "blurRadius": "CGFloat",
            "resizeMode": "RCTResizeMode"
          },
          "Constants": {

          },
          "Commands": {
            "getSize": 0,
            "prefetchImage": 1
          }
        },
        "Dimensions": {
          "window": {
            "width": 375,
            "scale": 2,
            "height": 667
          }
        },
        "RCTTextField": {
          "Manager": "RCTTextFieldManager",
          "NativeProps": {
            "selectionColor": "UIColor",
            "color": "UIColor",
            "selectTextOnFocus": "BOOL",
            "text": "NSString",
            "clearTextOnFocus": "BOOL",
            "autoCorrect": "BOOL",
            "autoCapitalize": "UITextAutocapitalizationType",
            "placeholder": "NSString",
            "secureTextEntry": "BOOL",
            "blurOnSubmit": "BOOL",
            "keyboardType": "UIKeyboardType",
            "clearButtonMode": "UITextFieldViewMode",
            "mostRecentEventCount": "NSInteger",
            "fontWeight": "NSString",
            "fontStyle": "NSString",
            "fontSize": "CGFloat",
            "onSelectionChange": "BOOL",
            "fontFamily": "NSString",
            "placeholderTextColor": "UIColor",
            "enablesReturnKeyAutomatically": "BOOL",
            "returnKeyType": "UIReturnKeyType",
            "editable": "BOOL",
            "textAlign": "NSTextAlignment",
            "password": "BOOL",
            "caretHidden": "BOOL",
            "keyboardAppearance": "UIKeyboardAppearance",
            "maxLength": "NSNumber"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTView": {
          "Manager": "RCTViewManager",
          "NativeProps": {
            "borderLeftWidth": "CGFloat",
            "paddingRight": "CGFloat",
            "marginRight": "CGFloat",
            "shouldRasterizeIOS": "BOOL",
            "maxHeight": "CGFloat",
            "backgroundColor": "UIColor",
            "borderTopWidth": "CGFloat",
            "borderLeftColor": "UIColor",
            "removeClippedSubviews": "BOOL",
            "zIndex": "NSInteger",
            "marginVertical": "CGFloat",
            "flexWrap": "css_wrap_type_t",
            "flex": "CGFloat",
            "position": "css_position_type_t",
            "paddingBottom": "CGFloat",
            "borderTopColor": "UIColor",
            "paddingTop": "CGFloat",
            "justifyContent": "css_justify_t",
            "padding": "CGFloat",
            "marginBottom": "CGFloat",
            "pointerEvents": "RCTPointerEvents",
            "shadowColor": "CGColor",
            "top": "CGFloat",
            "transformMatrix": "CATransform3D",
            "left": "CGFloat",
            "alignSelf": "css_align_t",
            "borderTopLeftRadius": "CGFloat",
            "minWidth": "CGFloat",
            "borderBottomWidth": "CGFloat",
            "borderColor": "CGColor",
            "borderTopRightRadius": "CGFloat",
            "flexDirection": "css_flex_direction_t",
            "margin": "CGFloat",
            "alignItems": "css_align_t",
            "marginHorizontal": "CGFloat",
            "borderRadius": "CGFloat",
            "opacity": "CGFloat",
            "shadowOpacity": "float",
            "right": "CGFloat",
            "paddingLeft": "CGFloat",
            "onAccessibilityTap": "BOOL",
            "minHeight": "CGFloat",
            "borderBottomLeftRadius": "CGFloat",
            "onMagicTap": "BOOL",
            "height": "CGFloat",
            "accessibilityTraits": "UIAccessibilityTraits",
            "borderWidth": "CGFloat",
            "paddingVertical": "CGFloat",
            "shadowOffset": "CGSize",
            "accessible": "BOOL",
            "borderStyle": "RCTBorderStyle",
            "borderRightColor": "UIColor",
            "overflow": "css_clip_t",
            "accessibilityLabel": "NSString",
            "borderBottomColor": "UIColor",
            "paddingHorizontal": "CGFloat",
            "hitSlop": "UIEdgeInsets",
            "borderBottomRightRadius": "CGFloat",
            "borderRightWidth": "CGFloat",
            "maxWidth": "CGFloat",
            "backfaceVisibility": "css_backface_visibility_t",
            "marginTop": "CGFloat",
            "testID": "NSString",
            "width": "CGFloat",
            "transform": "CATransform3D",
            "bottom": "CGFloat",
            "marginLeft": "CGFloat",
            "onLayout": "BOOL",
            "shadowRadius": "CGFloat"
          },
          "Constants": {
            "forceTouchAvailable": false
          },
          "Commands": {

          }
        },
        "RCTActivityIndicatorView": {
          "Manager": "RCTActivityIndicatorViewManager",
          "NativeProps": {
            "size": "UIActivityIndicatorViewStyle",
            "hidesWhenStopped": "BOOL",
            "animating": "BOOL",
            "color": "UIColor"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTNavItem": {
          "Manager": "RCTNavItemManager",
          "NativeProps": {
            "backButtonTitle": "NSString",
            "rightButtonTitle": "NSString",
            "leftButtonTitle": "NSString",
            "shadowHidden": "BOOL",
            "navigationBarHidden": "BOOL",
            "titleTextColor": "UIColor",
            "backButtonIcon": "UIImage",
            "titleImage": "UIImage",
            "tintColor": "UIColor",
            "title": "NSString",
            "translucent": "BOOL",
            "rightButtonIcon": "UIImage",
            "onLeftButtonPress": "BOOL",
            "onRightButtonPress": "BOOL",
            "barTintColor": "UIColor",
            "leftButtonIcon": "UIImage"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTRawText": {
          "Manager": "RCTRawTextManager",
          "NativeProps": {
            "text": "NSString"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTModalHostView": {
          "Manager": "RCTModalHostViewManager",
          "NativeProps": {
            "onShow": "BOOL",
            "animationType": "NSString",
            "transparent": "BOOL"
          },
          "Constants": {

          },
          "Commands": {

          }
        },
        "RCTWebView": {
          "Manager": "RCTWebViewManager",
          "NativeProps": {
            "onLoadingStart": "BOOL",
            "scrollEnabled": "BOOL",
            "onLoadingFinish": "BOOL",
            "allowsInlineMediaPlayback": "BOOL",
            "source": "NSDictionary",
            "scalesPageToFit": "BOOL",
            "onLoadingError": "BOOL",
            "mediaPlaybackRequiresUserAction": "BOOL",
            "decelerationRate": "CGFloat",
            "onShouldStartLoadWithRequest": "BOOL",
            "contentInset": "UIEdgeInsets",
            "bounces": "BOOL",
            "injectedJavaScript": "NSString",
            "automaticallyAdjustContentInsets": "BOOL"
          },
          "Constants": {

          },
          "Commands": {
            "goBack": 0,
            "goForward": 1,
            "reload": 2,
            "stopLoading": 3,
            "startLoadWithResult": 4
          }
        },
        "RCTTabBar": {
          "Manager": "RCTTabBarManager",
          "NativeProps": {
            "unselectedTintColor": "UIColor",
            "tintColor": "UIColor",
            "translucent": "BOOL",
            "barTintColor": "UIColor",
            "itemPositioning": "UITabBarItemPositioning"
          },
          "Constants": {

          },
          "Commands": {

          }
        }
      },
      [
        "removeSubviewsFromContainerWithID",
        "removeRootView",
        "replaceExistingNonRootView",
        "setChildren",
        "manageChildren",
        "createView",
        "updateView",
        "focus",
        "blur",
        "findSubviewIn",
        "dispatchViewManagerCommand",
        "measure",
        "measureInWindow",
        "measureLayout",
        "measureLayoutRelativeToParent",
        "measureViewsInRect",
        "takeSnapshot",
        "setJSResponder",
        "clearJSResponder",
        "configureNextLayoutAnimation"
      ],
      [
        16
      ]
    ],
    [
      "NavigatorManager",
      [
        "requestSchedulingJavaScriptNavigation"
      ]
    ],
    [
      "ActionSheetManager",
      [
        "showActionSheetWithOptions",
        "showShareActionSheetWithOptions"
      ]
    ],
    [
      "LocationObserver",
      [
        "startObserving",
        "stopObserving",
        "getCurrentPosition",
        "addListener",
        "removeListeners"
      ]
    ],
    [
      "ImageStoreManager",
      [
        "removeImageForTag",
        "hasImageForTag",
        "getBase64ForTag",
        "addImageFromBase64"
      ]
    ],
    [
      "ImageViewManager",
      [
        "getSize",
        "prefetchImage"
      ],
      [
        1
      ]
    ],
    null,
    null,
    [
      "ImageEditingManager",
      [
        "cropImage"
      ]
    ],
    null,
    [
      "LinkingManager",
      [
        "openURL",
        "canOpenURL",
        "getInitialURL",
        "addListener",
        "removeListeners"
      ],
      [
        0,
        1,
        2
      ]
    ],
    null,
    null,
    [
      "NetInfo",
      [
        "getCurrentConnectivity",
        "addListener",
        "removeListeners"
      ],
      [
        0
      ]
    ],
    [
      "Networking",
      [
        "sendRequest",
        "abortRequest",
        "addListener",
        "removeListeners"
      ]
    ],
    null,
    [
      "SettingsManager",
      {
        "settings": {
          "NSInterfaceStyle": "macintosh",
          "MSVLoggingMasterSwitchEnabledKey": 0,
          "AppleITunesStoreItemKinds": [
            "audiobook",
            "tv-episode",
            "booklet",
            "software",
            "software-update",
            "itunes-u",
            "ringtone",
            "tv-season",
            "movie",
            "mix",
            "wemix",
            "song",
            "tone",
            "artist",
            "podcast-episode",
            "podcast",
            "eBook",
            "document",
            "album",
            "music-video"
          ],
          "RCT_enableDev": 1,
          "AppleLanguagesDidMigrate": "9.3",
          "NSLanguages": [
            "en-US",
            "en"
          ],
          "AppleLanguages": [
            "en-US"
          ],
          "AppleKeyboardsExpanded": 1,
          "AppleKeyboards": [
            "en_US@hw=US;sw=QWERTY",
            "emoji@sw=Emoji",
            "de_AT@hw=German;sw=QWERTZ-German",
            "de_AT@hw=German;sw=QWERTZ-German"
          ],
          "RCT_enableMinification": 0,
          "AppleLocale": "en_US",
          "RCT_enableLiveReload": 0,
          "RCTDevMenu": {
            "profilingEnabled": 0,
            "showFPS": 0,
            "executorClass": "RCTWebSocketExecutor",
            "liveReloadEnabled": 0,
            "hotLoadingEnabled": 0,
            "shakeToShow": 1
          }
        }
      },
      [
        "deleteValues",
        "setValues"
      ]
    ],
    null,
    null,
    null,
    null,
    [
      "Vibration",
      [
        "vibrate"
      ]
    ],
    [
      "WebSocketModule",
      [
        "connect",
        "send",
        "sendBinary",
        "ping",
        "close",
        "addListener",
        "removeListeners"
      ]
    ]
  ]
};
