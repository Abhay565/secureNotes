import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './src/lib/supabase'
import SignUp from './src/screen/SignUp'
import HomeScreen from './src/screen/HomeScreen'
import Login from './src/screen/Login'
import NotesScreen from './src/screen/NotesScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={session ? 'HomeScreen' : 'Login'} screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="Notes" component={NotesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
