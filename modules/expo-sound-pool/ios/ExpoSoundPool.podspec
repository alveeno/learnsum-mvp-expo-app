Pod::Spec.new do |s|
  s.name           = 'ExpoSoundPool'
  s.version        = '1.0.0'
  s.summary        = 'Low-latency UI sound-effects pool (AVAudioEngine)'
  s.description    = 'Pre-decoded sound effects played through an AVAudioEngine player-node pool for near-zero, consistent latency.'
  s.author         = 'LearnSum'
  s.license        = 'MIT'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
